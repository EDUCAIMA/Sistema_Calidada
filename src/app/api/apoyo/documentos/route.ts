import { NextResponse } from 'next/server';
import type { DocumentType } from '@prisma/client';
import prisma from '@/lib/db';
import { canAccessTenant, getAuthenticatedUser } from '@/lib/auth-session';

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

async function requireTenantAccess(request: Request, tenantId: string, write = false) {
  const actor = await getAuthenticatedUser(request);
  if (!actor) return { error: 'La sesión segura expiró. Inicie sesión nuevamente.', status: 401 } as const;
  if (!canAccessTenant(actor.role, actor.tenantId, tenantId)) {
    return { error: 'No tiene autorización para gestionar documentos de otra empresa.', status: 403 } as const;
  }
  if (write && !['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO'].includes(actor.role)) {
    return { error: 'El perfil de auditor tiene acceso de solo lectura.', status: 403 } as const;
  }
  return { actor } as const;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId')?.trim();
    if (!tenantId) {
      return NextResponse.json({ error: 'La empresa es obligatoria.' }, { status: 400 });
    }

    const access = await requireTenantAccess(request, tenantId);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const documents = await prisma.document.findMany({
      where: { tenantId },
      include: documentInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'No fue posible consultar los documentos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type = typeof body.type === 'string' ? body.type.toUpperCase() as DocumentType : 'OTRO';
    const currentVersion = Number.isInteger(body.currentVersion) && body.currentVersion > 0
      ? body.currentVersion
      : 1;

    if (!tenantId || !code || !name || !documentTypes.has(type)) {
      return NextResponse.json(
        { error: 'Empresa, código, nombre y tipo documental son obligatorios.' },
        { status: 400 }
      );
    }

    const access = await requireTenantAccess(request, tenantId, true);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { actor } = access;

    const processId = cleanOptionalText(body.processId, 100);
    let processName = cleanOptionalText(body.processName, 200);
    if (processId) {
      const process = await prisma.process.findFirst({ where: { id: processId, tenantId, active: true } });
      if (!process) {
        return NextResponse.json({ error: 'El proceso seleccionado no pertenece a la empresa.' }, { status: 400 });
      }
      processName = process.name;
    }

    if (typeof body.id === 'string' && body.id) {
      const existing = await prisma.document.findFirst({ where: { id: body.id, tenantId } });
      if (!existing) {
        return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
      }
      if (existing.status !== 'BORRADOR') {
        return NextResponse.json(
          { error: 'Solo se pueden editar documentos en borrador.' },
          { status: 409 }
        );
      }

      const duplicate = await prisma.document.findFirst({
        where: { tenantId, code, currentVersion, id: { not: existing.id } },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json({ error: `Ya existe el documento ${code}, versión ${currentVersion}.` }, { status: 409 });
      }

      const document = await prisma.document.update({
        where: { id: existing.id },
        data: {
          code,
          name,
          type,
          processId,
          processName,
          currentVersion,
          fileUrl: cleanOptionalText(body.fileUrl, 2000),
          fileName: cleanOptionalText(body.fileName, 255),
          fileSize: Number.isInteger(body.fileSize) && body.fileSize >= 0 ? body.fileSize : null,
          nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,
        },
        include: documentInclude,
      });
      return NextResponse.json(document);
    }

    const duplicate = await prisma.document.findFirst({
      where: { tenantId, code, currentVersion },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: `Ya existe el documento ${code}, versión ${currentVersion}.` }, { status: 409 });
    }

    const fileUrl = cleanOptionalText(body.fileUrl, 2000);
    const fileName = cleanOptionalText(body.fileName, 255);
    const sourceDocumentId = cleanOptionalText(body.sourceDocumentId, 100);
    const document = await prisma.document.create({
      data: {
        tenantId,
        code,
        name,
        type,
        status: 'BORRADOR',
        processId,
        processName,
        currentVersion,
        fileUrl,
        fileName,
        fileSize: Number.isInteger(body.fileSize) && body.fileSize >= 0 ? body.fileSize : null,
        createdBy: actor.id,
        createdByName: actor.name,
        nextReviewDate: body.nextReviewDate ? new Date(body.nextReviewDate) : null,
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

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error saving document:', error);
    return NextResponse.json({ error: 'No fue posible guardar el documento.' }, { status: 500 });
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

    const access = await requireTenantAccess(request, tenantId, true);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

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
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'No fue posible eliminar el documento.' }, { status: 500 });
  }
}
