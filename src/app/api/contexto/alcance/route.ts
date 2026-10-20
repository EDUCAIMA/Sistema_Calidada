import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';

const scopeSchema = z.object({
    id: z.string().trim().min(1).max(200).optional(),
    tenantId: z.string().trim().min(1).max(200),
    scopeStatement: z.string().trim().min(1, 'La declaración de alcance es obligatoria.').max(100000),
});

export async function GET(request: Request) {
    try {
        const tenantId = new URL(request.url).searchParams.get('tenantId')?.trim() ?? '';
        await requireTenantAccess(request, tenantId);
        const scope = await prisma.sGCScope.findFirst({
            where: { tenantId },
            orderBy: { lastReviewDate: 'desc' },
        });
        return NextResponse.json(scope);
    } catch (error) {
        return apiError(error);
    }
}

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        await requireTenantAccess(request, raw?.tenantId, { write: true });
        const { id, tenantId, scopeStatement } = scopeSchema.parse(raw);
        if (id) {
            const existing = await prisma.sGCScope.findFirst({ where: { id, tenantId } });
            if (!existing) throw new ApiError(404, 'Alcance no encontrado en esta empresa.');
            const updated = await prisma.sGCScope.update({
                where: { id, tenantId, updatedAt: existing.updatedAt },
                // Saving the declaration must not erase the remaining scope information.
                data: { scopeStatement, lastReviewDate: new Date() },
            });
            return NextResponse.json(updated);
        }
        const created = await prisma.sGCScope.create({
            data: {
                tenantId,
                scopeStatement,
                applicableStandards: [],
                exclusions: [],
                sites: [],
                processes: [],
                lastReviewDate: new Date(),
                // This endpoint saves content; it does not constitute an approval.
                approvedBy: '',
            },
        });
        return NextResponse.json(created);
    } catch (error) {
        return apiError(error);
    }
}
