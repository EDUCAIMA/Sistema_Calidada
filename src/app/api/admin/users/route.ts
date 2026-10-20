import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { getAuthenticatedUser } from '@/lib/auth-session';

const userSchema = z.object({
    email: z.email('El correo no es válido.').trim().toLowerCase().max(254),
    name: z.string().trim().min(2, 'Ingrese el nombre completo.').max(250),
    role: z.enum(['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO', 'AUDITOR_INTERNO', 'AUDITOR_EXTERNO']),
    tenantId: z.string().trim().min(1),
    position: z.string().trim().max(250).nullish(),
    active: z.boolean().optional().default(true),
    topManagement: z.boolean().optional().default(false),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').max(72).optional().or(z.literal('')),
});

export async function GET(request: Request) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const tenantId = searchParams.get('tenantId');
        const manage = searchParams.get('manage') === 'true';
        if (manage && !tenantId) await requireTenantAccess(request, tenantId, { admin: true });
        if (tenantId) {
            await requireTenantAccess(request, tenantId, { admin: manage });
            if (manage) {
                return NextResponse.json(await prisma.user.findMany({
                    where: { tenantId },
                    select: { id: true, tenantId: true, email: true, name: true, position: true, role: true, topManagement: true, active: true, createdAt: true, updatedAt: true },
                    orderBy: [{ active: 'desc' }, { name: 'asc' }],
                }));
            }
            return NextResponse.json(await prisma.user.findMany({
                where: { tenantId, active: true },
                select: { id: true, tenantId: true, name: true, position: true, role: true, topManagement: true, active: true },
                orderBy: { name: 'asc' },
            }));
        }
        const actor = await getAuthenticatedUser(request);
        if (!actor) throw new ApiError(401, 'La sesión expiró. Inicie sesión nuevamente.');
        if (actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'La consulta global requiere un superadministrador. Indique la empresa para consultar su directorio.');
        const users = await prisma.user.findMany({
            select: {
                id: true, tenantId: true, email: true, name: true, position: true, role: true, topManagement: true,
                avatar: true, active: true, createdAt: true, updatedAt: true, phone: true,
                tenant: { select: { id: true, name: true, slug: true, plan: true, active: true, createdAt: true } },
            }, orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(users);
    } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        const actor = await requireTenantAccess(request, raw?.tenantId, { admin: true, write: true });
        const body = userSchema.parse(raw);
        if (body.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'Solo un superadministrador puede asignar ese rol.');
        if (body.topManagement && (body.role === 'AUDITOR_INTERNO' || body.role === 'AUDITOR_EXTERNO')) {
            throw new ApiError(400, 'Un perfil de auditor no puede designarse como alta dirección.');
        }
        const { password, ...data } = body;
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const user = await prisma.$transaction(async tx => {
            const created = await tx.user.create({
                data: { ...data, password: hashedPassword },
                select: { id: true, tenantId: true, email: true, name: true, position: true, role: true, topManagement: true, active: true, createdAt: true, updatedAt: true, tenant: true },
            });
            if (created.topManagement) {
                await tx.leadershipRecordEvent.create({ data: {
                    tenantId: created.tenantId,
                    recordType: 'TOP_MANAGEMENT_DESIGNATION',
                    recordId: created.id,
                    action: 'ALTA_DIRECCION_DESIGNADA',
                    userId: actor.id,
                    userName: actor.name,
                    snapshot: { userId: created.id, userName: created.name, previous: false, current: true },
                } });
            }
            return created;
        });
        return NextResponse.json(user, { status: 201 });
    } catch (error) { return apiError(error); }
}
