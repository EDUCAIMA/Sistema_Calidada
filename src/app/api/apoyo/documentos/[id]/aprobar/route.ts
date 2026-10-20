import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { canAccessTenant, canApproveDocuments, getAuthenticatedUser } from '@/lib/auth-session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getAuthenticatedUser(request);
    if (!actor) {
      return NextResponse.json({ error: 'La sesión segura expiró. Inicie sesión nuevamente para aprobar.' }, { status: 401 });
    }
    if (!canApproveDocuments(actor.role)) {
      return NextResponse.json({ error: 'Solo un administrador puede aprobar documentos.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
    if (!tenantId) return NextResponse.json({ error: 'La empresa es obligatoria.' }, { status: 400 });
    if (!canAccessTenant(actor.role, actor.tenantId, tenantId)) {
      return NextResponse.json({ error: 'No tiene autorización para esta empresa.' }, { status: 403 });
    }

    const target = await prisma.document.findFirst({ where: { id, tenantId } });
    if (!target) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    if (target.status !== 'EN_REVISION') {
      return NextResponse.json({ error: 'Solo se pueden aprobar documentos en revisión.' }, { status: 409 });
    }

    const approvedDate = new Date();
    const result = await prisma.$transaction(async tx => {
      const previousDocuments = await tx.document.findMany({
        where: {
          tenantId,
          code: target.code,
          status: 'APROBADO',
          id: { not: target.id },
        },
        select: { id: true, currentVersion: true },
      });

      if (previousDocuments.length) {
        await tx.document.updateMany({
          where: { id: { in: previousDocuments.map(document => document.id) } },
          data: { status: 'OBSOLETO' },
        });
        await Promise.all(previousDocuments.map(document => tx.documentApprovalEvent.create({
          data: {
            documentId: document.id,
            action: 'SUPERSEDED',
            fromStatus: 'APROBADO',
            toStatus: 'OBSOLETO',
            userId: actor.id,
            userName: actor.name,
            note: `Sustituido por ${target.code}, versión ${target.currentVersion}.`,
          },
        })));
      }

      const document = await tx.document.update({
        where: { id: target.id },
        data: {
          status: 'APROBADO',
          approvedBy: actor.id,
          approvedByName: actor.name,
          approvedDate,
          approvalEvents: {
            create: {
              action: 'APPROVED',
              fromStatus: 'EN_REVISION',
              toStatus: 'APROBADO',
              userId: actor.id,
              userName: actor.name,
              note: note || 'Documento aprobado y puesto en vigencia.',
            },
          },
        },
        include: {
          versions: { orderBy: { version: 'desc' } },
          approvalEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      });

      return {
        document,
        supersededDocumentIds: previousDocuments.map(previous => previous.id),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error approving document:', error);
    return NextResponse.json({ error: 'No fue posible aprobar el documento.' }, { status: 500 });
  }
}
