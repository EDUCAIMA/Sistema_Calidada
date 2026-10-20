import { NextResponse } from 'next/server';
import type { DocumentType, Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { formatDocumentCode, parseDocumentStandardConfig } from '@/lib/document-standard';

const documentTypes = new Set<DocumentType>([
  'MANUAL',
  'PROCEDIMIENTO',
  'INSTRUCTIVO',
  'FORMATO',
  'POLITICA',
  'GUIA',
  'REGISTRO',
  'OTRO',
]);

const documentInclude = {
  versions: { orderBy: { version: 'desc' as const } },
  approvalEvents: { orderBy: { createdAt: 'desc' as const }, take: 50 },
};

function cleanOptionalText(value: unknown, maxLength = 500) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

async function allocateCode(
  transaction: Prisma.TransactionClient,
  tenantId: string,
  documentTypeId: string,
) {
  const stored = await transaction.documentStandard.findUnique({ where: { tenantId } });
  const config = parseDocumentStandardConfig(stored?.config);
  const type = config.documentTypes.find(item => item.id === documentTypeId && item.active);
  if (!type) throw new ApiError(400, 'Seleccione un tipo documental activo del estándar de esta empresa.');
  const seriesKey = [config.organizationPrefix, type.prefix].join(config.separator);
  const prefix = seriesKey + config.separator;
  const existingCounter = await transaction.documentCodeCounter.findUnique({
    where: { tenantId_seriesKey: { tenantId, seriesKey } },
  });
  let firstValue = 1;
  if (!existingCounter) {
    const existingCodes = await transaction.document.findMany({
      where: { tenantId, code: { startsWith: prefix } }, select: { code: true },
    });
    for (const existing of existingCodes) {
      const suffix = existing.code.slice(prefix.length);
      if (/^\d{1,9}$/.test(suffix)) firstValue = Math.max(firstValue, Number(suffix) + 1);
    }
  }
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const counter = await transaction.documentCodeCounter.upsert({
      where: { tenantId_seriesKey: { tenantId, seriesKey } },
      create: { tenantId, seriesKey, lastValue: firstValue },
      update: { lastValue: { increment: 1 } },
    });
    const code = formatDocumentCode(config, type.prefix, counter.lastValue);
    const duplicate = await transaction.document.findFirst({ where: { tenantId, code }, select: { id: true } });
    if (!duplicate) return code;
  }
  throw new ApiError(409, 'No fue posible asignar un código libre. Revise la serie documental.');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId')?.trim();
    if (!tenantId) {
      return NextResponse.json({ error: 'La empresa es obligatoria.' }, { status: 400 });
    }

    await requireTenantAccess(request, tenantId);

    const documents = await prisma.document.findMany({
      where: { tenantId },
      include: documentInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(documents);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiError(400, 'La solicitud debe contener los datos de un documento.');
    }
    const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type = typeof body.type === 'string' ? body.type.toUpperCase() as DocumentType : 'OTRO';
    const requestedTypeId = cleanOptionalText(body.documentTypeId, 50)?.toUpperCase() ?? null;
    const currentVersion = Number.isInteger(body.currentVersion) && body.currentVersion > 0
      ? body.currentVersion
      : 1;

    if (!tenantId || !name || name.length > 300 || code.length > 100 || !documentTypes.has(type)) {
      return NextResponse.json(
        { error: 'Empresa, nombre y tipo documental válidos son obligatorios (nombre: hasta 300; código: hasta 100 caracteres).' },
        { status: 400 }
      );
    }

    const actor = await requireTenantAccess(request, tenantId, { write: true });

    const processId = cleanOptionalText(body.processId, 100);
    let processName = cleanOptionalText(body.processName, 200);
    if (processId) {
      const process = await prisma.process.findFirst({ where: { id: processId, tenantId, active: true } });
      if (!process) {
        return NextResponse.json({ error: 'El proceso seleccionado no pertenece a la empresa.' }, { status: 400 });
      }
      processName = process.name;
    }

    const reviewDate = body.nextReviewDate ? new Date(body.nextReviewDate) : null;
    if (reviewDate && Number.isNaN(reviewDate.getTime())) {
      throw new ApiError(400, 'La fecha de próxima revisión no es válida.');
    }
    const isEdit = typeof body.id === 'string' && Boolean(body.id);
    const sourceDocumentId = cleanOptionalText(body.sourceDocumentId, 100);
    const document = await prisma.$transaction(async transaction => {
      // All code assignment (including manual codes) is serialized per tenant.
      // Existing records are never recoded when the standard is edited.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenantId}, 61020001))`;
      const stored = await transaction.documentStandard.findUnique({ where: { tenantId } });
      const config = parseDocumentStandardConfig(stored?.config);
      const existing = isEdit
        ? await transaction.document.findFirst({ where: { id: body.id, tenantId } })
        : null;
      if (isEdit && !existing) throw new ApiError(404, 'Documento no encontrado.');
      if (existing && existing.status !== 'BORRADOR') {
        throw new ApiError(409, 'Solo se pueden editar documentos en borrador.');
      }
      const source = !isEdit && sourceDocumentId
        ? await transaction.document.findFirst({ where: { id: sourceDocumentId, tenantId } })
        : null;
      if (!isEdit && sourceDocumentId && !source) throw new ApiError(404, 'Documento de origen no encontrado.');
      if (source && ((code && code !== source.code) || currentVersion <= source.currentVersion)) {
        throw new ApiError(400, 'Una nueva versión debe conservar el código de origen y aumentar la versión.');
      }
      const historical = existing ?? source;
      const selectedType = requestedTypeId
        ? historical?.documentTypeId === requestedTypeId
          ? { id: historical.documentTypeId, name: historical.documentTypeName, baseType: historical.type }
          : config.documentTypes.find(item => item.id === requestedTypeId && item.active)
        : historical?.documentTypeId
          ? { id: historical.documentTypeId, name: historical.documentTypeName, baseType: historical.type }
          : null;
      if (requestedTypeId && !selectedType) {
        throw new ApiError(400, 'Seleccione un tipo documental activo del estándar de esta empresa.');
      }

      if (existing) {
        const savedCode = code || existing.code;
        const duplicate = await transaction.document.findFirst({
          where: { tenantId, code: savedCode, currentVersion, id: { not: existing.id } },
          select: { id: true },
        });
        if (duplicate) {
          throw new ApiError(409, `Ya existe el documento ${savedCode}, versión ${currentVersion}.`);
        }
        return transaction.document.update({
          where: { id: existing.id, status: 'BORRADOR' },
          data: {
            code: savedCode,
            name,
            type: selectedType?.baseType ?? type,
            documentTypeId: selectedType?.id ?? existing.documentTypeId,
            documentTypeName: selectedType?.name ?? existing.documentTypeName,
            processId,
            processName,
            currentVersion,
            fileUrl: cleanOptionalText(body.fileUrl, 2000),
            fileName: cleanOptionalText(body.fileName, 255),
            fileSize: Number.isInteger(body.fileSize) && body.fileSize >= 0 ? body.fileSize : null,
            nextReviewDate: reviewDate,
          },
          include: documentInclude,
        });
      }

      if (!code && !requestedTypeId && !source) {
        throw new ApiError(400, 'Indique un código o seleccione un tipo del estándar para asignarlo automáticamente.');
      }
      const assignedCode = source?.code || code || await allocateCode(transaction, tenantId, requestedTypeId!);
      const duplicate = await transaction.document.findFirst({
        where: { tenantId, code: assignedCode, currentVersion },
        select: { id: true },
      });
      if (duplicate) {
        throw new ApiError(409, `Ya existe el documento ${assignedCode}, versión ${currentVersion}.`);
      }

      const fileUrl = cleanOptionalText(body.fileUrl, 2000);
      const fileName = cleanOptionalText(body.fileName, 255);
      return transaction.document.create({
        data: {
          tenantId,
          code: assignedCode,
          name,
          type: selectedType?.baseType ?? type,
          documentTypeId: selectedType?.id ?? null,
          documentTypeName: selectedType?.name ?? null,
          status: 'BORRADOR',
          processId,
          processName,
          currentVersion,
          fileUrl,
          fileName,
          fileSize: Number.isInteger(body.fileSize) && body.fileSize >= 0 ? body.fileSize : null,
          createdBy: actor.id,
          createdByName: actor.name,
          nextReviewDate: reviewDate,
          versions: fileUrl && fileName ? {
            create: {
              version: currentVersion,
              changeDescription: cleanOptionalText(body.changeDescription, 1000)
                || (sourceDocumentId ? 'Nueva versión para revisión.' : 'Creación inicial.'),
              fileUrl,
              fileName,
              uploadedBy: actor.id,
              uploadedByName: actor.name,
            },
          } : undefined,
          approvalEvents: {
            create: {
              action: sourceDocumentId ? 'NEW_VERSION_CREATED' : 'CREATED',
              fromStatus: 'BORRADOR',
              toStatus: 'BORRADOR',
              userId: actor.id,
              userName: actor.name,
              note: cleanOptionalText(body.changeDescription, 1000)
                || (sourceDocumentId ? 'Nueva versión creada para actualización.' : 'Documento creado como borrador.'),
            },
          },
        },
        include: documentInclude,
      });
    }, { maxWait: 10000, timeout: 15000 });
    return NextResponse.json(document, { status: isEdit ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    const tenantId = searchParams.get('tenantId')?.trim();
    if (!id || !tenantId) {
      return NextResponse.json({ error: 'Documento y empresa son obligatorios.' }, { status: 400 });
    }

    await requireTenantAccess(request, tenantId, { write: true });

    const document = await prisma.document.findFirst({ where: { id, tenantId } });
    if (!document) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    if (document.status !== 'BORRADOR') {
      return NextResponse.json({ error: 'Solo se pueden eliminar documentos en borrador.' }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.documentVersion.deleteMany({ where: { documentId: id } }),
      prisma.document.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
