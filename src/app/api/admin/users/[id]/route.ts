import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { getAuthenticatedUser } from '@/lib/auth-session';

const profileFields = {
    name: z.string().trim().min(2).max(250).optional(),
    position: z.string().trim().max(250).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').max(72).optional().or(z.literal('')),
};
const profileSchema = z.object(profileFields).strict();
const adminSchema = z.object({
    ...profileFields,
    email: z.email('El correo no es válido.').trim().toLowerCase().max(254).optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO', 'AUDITOR_INTERNO', 'AUDITOR_EXTERNO']).optional(),
    tenantId: z.string().trim().min(1).optional(), active: z.boolean().optional(), topManagement: z.boolean().optional(),
});
const publicSelect = {
    id: true, tenantId: true, name: true, email: true, position: true, phone: true,
    role: true, topManagement: true, active: true, avatar: true, createdAt: true, updatedAt: true,
    tenant: true,
} as const;

async function resolveUser(request: Request, id: string) {
    const actor = await getAuthenticatedUser(request);
    if (!actor) throw new ApiError(401, 'La sesión expiró. Inicie sesión nuevamente.');
    const user = await prisma.user.findFirst({ where: { id, ...(actor.role === 'SUPER_ADMIN' ? {} : { tenantId: actor.tenantId }) }, select: publicSelect });
    if (!user) throw new ApiError(404, 'Usuario no encontrado.');
    await requireTenantAccess(request, user.tenantId);
    return { actor, user, admin: actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN_EMPRESA' };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { actor, user, admin } = await resolveUser(request, (await params).id);
        if (!admin && actor.id !== user.id) throw new ApiError(403, 'Solo puede consultar su perfil.');
        return NextResponse.json(user);
    } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { actor, user, admin } = await resolveUser(request, (await params).id);
        if (!admin && actor.id !== user.id) throw new ApiError(403, 'Se requiere un administrador para gestionar otro usuario.');
        if (user.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'Solo un superadministrador puede modificar ese usuario.');
        const raw = await request.json();
        const body = admin ? adminSchema.parse(raw) : profileSchema.parse(raw);
        const privileges = adminSchema.parse(body);
        if (privileges.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'No puede asignar el rol de superadministrador.');
        const resultingRole = privileges.role || user.role;
        const resultingTopManagement = privileges.topManagement ?? user.topManagement;
        if (resultingTopManagement && (resultingRole === 'AUDITOR_INTERNO' || resultingRole === 'AUDITOR_EXTERNO')) {
            throw new ApiError(400, 'Un perfil de auditor no puede conservar la designación de alta dirección. Retire la designación o elija otro rol.');
        }
        if (privileges.tenantId && privileges.tenantId !== user.tenantId) {
            if (actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'No puede trasladar usuarios a otra empresa.');
            await requireTenantAccess(request, privileges.tenantId, { admin: true });
            const assignments = await Promise.all([
                prisma.process.count({ where: { responsibleId: user.id } }),
                prisma.qualityObjective.count({ where: { responsibleId: user.id } }),
                prisma.risk.count({ where: { responsibleId: user.id } }),
                prisma.changePlan.count({ where: { responsibleId: user.id } }),
                prisma.leadershipCommitment.count({ where: { responsibleId: user.id } }),
                prisma.responsibilityAssignment.count({ where: { assignedToId: user.id } }),
            ]);
            if (assignments.some(Boolean)) throw new ApiError(409, 'El usuario tiene responsabilidades registradas. Conserve su empresa para mantener la trazabilidad.');
        }
        if (actor.id === user.id && (privileges.active === false || (privileges.role && privileges.role !== user.role))) {
            throw new ApiError(409, 'Otro administrador debe gestionar su desactivación o cambio de rol.');
        }
        const { password, ...data } = privileges;
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const updated = await prisma.$transaction(async tx => {
            const changed = await tx.user.update({
                where: { id: user.id, tenantId: user.tenantId, updatedAt: user.updatedAt },
                data: { ...data, ...(hashedPassword ? { password: hashedPassword } : {}) },
                select: publicSelect,
            });
            if (changed.topManagement !== user.topManagement) {
                await tx.leadershipRecordEvent.create({ data: {
                    tenantId: user.tenantId,
                    recordType: 'TOP_MANAGEMENT_DESIGNATION',
                    recordId: user.id,
                    action: changed.topManagement ? 'ALTA_DIRECCION_DESIGNADA' : 'ALTA_DIRECCION_REVOCADA',
                    userId: actor.id,
                    userName: actor.name,
                    snapshot: { userId: user.id, userName: changed.name, previous: user.topManagement, current: changed.topManagement },
                } });
            }
            return changed;
        });
        return NextResponse.json(updated);
    } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { actor, user } = await resolveUser(request, (await params).id);
        await requireTenantAccess(request, user.tenantId, { admin: true, write: true });
        if (user.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'Solo un superadministrador puede gestionar ese usuario.');
        if (actor.id === user.id) throw new ApiError(409, 'No puede desactivar su propia sesión.');
        await prisma.user.update({ where: { id: user.id, tenantId: user.tenantId }, data: { active: false } });
        return NextResponse.json({ success: true, deactivated: true });
    } catch (error) { return apiError(error); }
}
