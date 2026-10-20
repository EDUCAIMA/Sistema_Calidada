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
      return NextResponse.json({ error: 'La sesión segura expiró. Inicie sesión nuevamente.' }, { status: 401 });
    }
    if (!canApproveDocuments(actor.role)) {
      return NextResponse.json({ error: 'Solo un administrador puede devolver documentos para ajustes.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';
    if (!tenantId || !note) {
      return NextResponse.json({ error: 'La empresa y la observación de ajustes son obligatorias.' }, { status: 400 });
    }
    if (!canAccessTenant(actor.role, actor.tenantId, tenantId)) {
      return NextResponse.json({ error: 'No tiene autorización para esta empresa.' }, { status: 403 });
    }

    const target = await prisma.document.findFirst({ where: { id, tenantId } });
    if (!target) return NextResponse.json({ error: 'Documento no encontrado.' }, { status: 404 });
    if (target.status !== 'EN_REVISION') {
      return NextResponse.json({ error: 'Solo se pueden devolver documentos en revisión.' }, { status: 409 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        status: 'BORRADOR',
        approvalEvents: {
          create: {
            action: 'CHANGES_REQUESTED',
            fromStatus: 'EN_REVISION',
            toStatus: 'BORRADOR',
            userId: actor.id,
            userName: actor.name,
            note,
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
    console.error('Error requesting document changes:', error);
    return NextResponse.json({ error: 'No fue posible devolver el documento para ajustes.' }, { status: 500 });
  }
}
