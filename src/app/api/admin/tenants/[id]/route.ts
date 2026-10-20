import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tenantId } = await params;
        await requireTenantAccess(request, tenantId, { admin: true, write: true });
        const body = await request.json();

        const { name, industry, timezone, currency, phone, logo } = body;

        const updated = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(name !== undefined && { name }),
                ...(industry !== undefined && { industry }),
                ...(timezone !== undefined && { timezone }),
                ...(currency !== undefined && { currency }),
                ...(phone !== undefined && { phone }),
                ...(logo !== undefined && { logo }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) { return apiError(error); }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tenantId } = await params;
        const actor = await getAuthenticatedUser(request);
        if (!actor) throw new ApiError(401, 'Inicie sesión nuevamente.');
        if (actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'La desactivación de una empresa requiere un superadministrador.');
        const { adminPassword, adminEmail } = await request.json();

        if (!tenantId || typeof adminPassword !== 'string' || !adminPassword || typeof adminEmail !== 'string' || !adminEmail.trim()) {
            return NextResponse.json(
                { error: 'Información incompleta para la desactivación' },
                { status: 400 }
            );
        }

        if (tenantId === actor.tenantId) {
            throw new ApiError(409, 'No puede desactivar la empresa a la que pertenece su propia cuenta. Use otro superadministrador para evitar perder el acceso global.');
        }

        const [admin, tenant] = await Promise.all([
            prisma.user.findFirst({
                where: { id: actor.id, email: adminEmail.trim().toLowerCase(), role: 'SUPER_ADMIN', active: true },
                select: { id: true, password: true },
            }),
            prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, active: true } }),
        ]);

        if (!tenant) {
            throw new ApiError(404, 'Empresa no encontrada.');
        }

        if (!admin) {
             return NextResponse.json(
                { error: 'No tienes permisos para realizar esta acción' },
                { status: 403 }
            );
        }

        const isPasswordCorrect = admin.password
            ? await bcrypt.compare(adminPassword, admin.password).catch(() => false)
            : false;
        if (!isPasswordCorrect) {
            return NextResponse.json(
                { error: 'Contraseña de administrador incorrecta' },
                { status: 401 }
            );
        }

        if (!tenant.active) {
            return NextResponse.json({
                message: 'La empresa ya estaba desactivada. Sus registros permanecen conservados.',
                tenantId,
                deactivated: true,
                alreadyInactive: true,
            });
        }

        const changed = await prisma.tenant.updateMany({
            where: { id: tenantId, active: true },
            data: { active: false },
        });

        if (changed.count !== 1) throw new ApiError(409, 'La empresa cambió durante la desactivación. Actualice la página.');

        return NextResponse.json({
            message: 'Empresa desactivada. Los usuarios y registros del SGC permanecen conservados.',
            tenantId,
            deactivated: true,
            alreadyInactive: false,
        });
    } catch (error) { return apiError(error); }
}
