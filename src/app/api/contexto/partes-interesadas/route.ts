import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { getAuthenticatedUser } from '@/lib/auth-session';

const optionalText = z.string().trim().max(5000).nullish().transform(value => value || '');
const stakeholderSchema = z.object({
    id: z.string().trim().min(1).max(200).optional(),
    tenantId: z.string().trim().min(1).max(200),
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(500),
    type: z.enum(['INTERNO', 'EXTERNO']),
    influence: z.enum(['ALTA', 'MEDIA', 'BAJA']),
    needs: optionalText, expectations: optionalText, strategy: optionalText, contactInfo: optionalText,
});

export async function GET(request: Request) {
    try {
        const tenantId = new URL(request.url).searchParams.get('tenantId') || '';
        await requireTenantAccess(request, tenantId);
        return NextResponse.json(await prisma.stakeholder.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }));
    } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        await requireTenantAccess(request, raw?.tenantId, { write: true });
        const { id, ...data } = stakeholderSchema.parse(raw);
        if (id) {
            const existing = await prisma.stakeholder.findFirst({ where: { id, tenantId: data.tenantId } });
            if (!existing) throw new ApiError(404, 'Parte interesada no encontrada en esta empresa.');
            return NextResponse.json(await prisma.stakeholder.update({ where: { id, tenantId: data.tenantId, updatedAt: existing.updatedAt }, data }));
        }
        return NextResponse.json(await prisma.stakeholder.create({ data }), { status: 201 });
    } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
    try {
        const actor = await getAuthenticatedUser(request);
        if (!actor) throw new ApiError(401, 'La sesión expiró. Inicie sesión nuevamente.');
        const id = new URL(request.url).searchParams.get('id');
        if (!id) throw new ApiError(400, 'El identificador es obligatorio.');
        const existing = await prisma.stakeholder.findFirst({ where: { id, ...(actor.role === 'SUPER_ADMIN' ? {} : { tenantId: actor.tenantId }) } });
        if (!existing) throw new ApiError(404, 'Parte interesada no encontrada.');
        await requireTenantAccess(request, existing.tenantId, { write: true });
        await prisma.$transaction(async tx => {
            if (await tx.risk.count({ where: { tenantId: existing.tenantId, sourceType: 'PARTE_INTERESADA', sourceId: id } })) {
                throw new ApiError(409, 'Esta parte interesada es el origen de riesgos u oportunidades registrados. Debe conservarse para mantener su trazabilidad.');
            }
            await tx.stakeholder.delete({ where: { id, tenantId: existing.tenantId, updatedAt: existing.updatedAt } });
        });
        return NextResponse.json({ success: true });
    } catch (error) { return apiError(error); }
}
