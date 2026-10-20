import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { canAccessTenant, getAuthenticatedUser } from '@/lib/auth-session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getAuthenticatedUser(request);
    if (!actor) {
      return NextResponse.json({ error: 'La sesión segura expiró. Inicie sesión nuevamente.' }, { status: 401 });
    }
    if (!['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO'].includes(actor.role)) {
      return NextResponse.json({ error: 'El perfil de auditor tiene acceso de solo lectura.' }, { status: 403 });
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
    if (target.status !== 'BORRADOR') {
      return NextResponse.json({ error: 'Solo un borrador se puede enviar a revisión.' }, { status: 409 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'EN_REVISION',
        submittedBy: actor.id,
        submittedByName: actor.name,
        submittedAt: new Date(),
        approvalEvents: {
          create: {
            action: 'SUBMITTED_FOR_REVIEW',
            fromStatus: 'BORRADOR',
            toStatus: 'EN_REVISION',
            userId: actor.id,
            userName: actor.name,
            note: note || 'Documento enviado a revisión y aprobación.',
          },
        },
      },
      include: {
        versions: { orderBy: { version: 'desc' } },
        approvalEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error submitting document:', error);
    return NextResponse.json({ error: 'No fue posible enviar el documento a revisión.' }, { status: 500 });
  }
}
