import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { getAuthenticatedUser } from '@/lib/auth-session';

const processSchema = z.object({
    id: z.string().trim().min(1).optional(),
    tenantId: z.string().trim().min(1),
    name: z.string().trim().min(1, 'El nombre del proceso es obligatorio.').max(250),
    code: z.string().trim().min(1, 'El código del proceso es obligatorio.').max(100),
    category: z.enum(['ESTRATEGICO', 'MISIONAL', 'APOYO', 'EVALUACION']),
    objective: z.string().trim().max(5000).optional().default(''),
    scope: z.string().trim().max(5000).optional().default(''),
    responsibleId: z.string().trim().min(1, 'Seleccione un responsable.'),
});

export async function GET(request: Request) {
    try {
        const tenantId = new URL(request.url).searchParams.get('tenantId') || '';
        await requireTenantAccess(request, tenantId);
        const processes = await prisma.process.findMany({
            where: { tenantId, active: true }, orderBy: { order: 'asc' },
            include: { characterization: true, responsible: { select: { name: true } } },
        });
        return NextResponse.json(processes.map((process) => ({
            ...process, responsibleName: process.responsible?.name || process.responsibleName || '—',
        })));
    } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        await requireTenantAccess(request, raw?.tenantId, { write: true });
        const body = processSchema.parse(raw);
        const { id, ...data } = body;
        const responsible = await prisma.user.findFirst({ where: { id: body.responsibleId, tenantId: body.tenantId, active: true } });
        if (!responsible) throw new ApiError(400, 'El responsable debe ser un usuario activo de la empresa.');
        const existing = id ? await prisma.process.findFirst({ where: { id, tenantId: body.tenantId, active: true } }) : null;
        if (id && !existing) throw new ApiError(404, 'Proceso no encontrado.');
        const duplicate = await prisma.process.findFirst({ where: { tenantId: body.tenantId, code: body.code, active: true, ...(id ? { id: { not: id } } : {}) }, select: { id: true } });
        if (duplicate) throw new ApiError(409, 'Ya existe un proceso activo con ese código.');
        const result = existing
            ? await prisma.process.update({ where: { id: existing.id, tenantId: body.tenantId, updatedAt: existing.updatedAt, active: true }, data: { ...data, responsibleName: responsible.name } })
            : await prisma.process.create({ data: { ...data, responsibleName: responsible.name, order: 0 } });
        return NextResponse.json(result, { status: existing ? 200 : 201 });
    } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
    try {
        const actor = await getAuthenticatedUser(request);
        if (!actor) throw new ApiError(401, 'La sesión expiró. Inicie sesión nuevamente.');
        const id = new URL(request.url).searchParams.get('id');
        if (!id) throw new ApiError(400, 'El identificador es obligatorio.');
        const existing = await prisma.process.findFirst({ where: { id, ...(actor.role === 'SUPER_ADMIN' ? {} : { tenantId: actor.tenantId }) } });
        if (!existing) throw new ApiError(404, 'Proceso no encontrado.');
        await requireTenantAccess(request, existing.tenantId, { write: true });
        // Retirar del mapa sin romper documentos, riesgos ni historial de objetivos.
        await prisma.process.update({ where: { id: existing.id, tenantId: existing.tenantId }, data: { active: false } });
        return NextResponse.json({ success: true, archived: true });
    } catch (error) { return apiError(error); }
}
