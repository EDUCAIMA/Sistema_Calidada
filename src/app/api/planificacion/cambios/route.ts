import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { requireTenantAccess } from '@/lib/api-auth';
import { canEditPlan, changePlanSchema, planReviewSchema, reviewStatus } from '@/lib/planning-validation';
import { expectedVersion, PlanningError, planningError, planningMetadata, planningReferences } from '@/lib/planning-server';

export const dynamic = 'force-dynamic';
const include = { reviews: { orderBy: { createdAt: 'desc' as const } } };

export async function GET(request: NextRequest) {
    try {
        const tenantId = new URL(request.url).searchParams.get('tenantId') || '';
        await requireTenantAccess(request, tenantId);
        const [records, metadata] = await Promise.all([
            prisma.changePlan.findMany({ where: { tenantId }, include, orderBy: { updatedAt: 'desc' } }),
            planningMetadata(tenantId),
        ]);
        return NextResponse.json({ records, ...metadata });
    } catch (error) { return planningError(error); }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PlanningError('La solicitud debe contener un registro.');
        const tenantId = typeof body.tenantId === 'string' ? body.tenantId : '';
        const actor = await requireTenantAccess(request, tenantId, { write: true });
        if (body.action === 'review') {
            const review = planReviewSchema.parse(body);
            const version = expectedVersion(body.updatedAt);
            const record = await prisma.$transaction(async (tx) => {
                const existing = await tx.changePlan.findFirst({ where: { id: String(body.id || ''), tenantId } });
                if (!existing) throw new PlanningError('Cambio no encontrado.', 404);
                let status: string;
                try { status = reviewStatus('change', existing.status, review.result); }
                catch (error) { throw new PlanningError((error as Error).message, 409); }
                const updated = await tx.changePlan.updateMany({
                    where: { id: existing.id, tenantId, updatedAt: version, status: existing.status }, data: { status },
                });
                if (!updated.count) throw new PlanningError('Otra persona actualizó este cambio. Recarga antes de guardar.', 409);
                await tx.changeReview.create({ data: {
                    changePlanId: existing.id, result: review.result, evaluation: review.evaluation,
                    evidence: review.evidence, followUp: review.followUp || null,
                    userId: actor.id, userName: actor.name,
                    planSnapshot: JSON.parse(JSON.stringify(existing)) as Prisma.InputJsonValue,
                } });
                return tx.changePlan.findUniqueOrThrow({ where: { id: existing.id }, include });
            });
            return NextResponse.json(record);
        }
        const plan = changePlanSchema.parse(body);
        const { process, responsible } = await planningReferences(tenantId, plan.processId, plan.responsibleId);
        const data = { ...plan, tenantId, processName: process.name, responsibleName: responsible.name };
        if (!body.id) {
            if (plan.status !== 'PLANIFICADO') throw new PlanningError('El cambio nuevo debe comenzar como planificado.');
            return NextResponse.json(await prisma.changePlan.create({
                data: { ...data, createdBy: actor.id, createdByName: actor.name }, include,
            }), { status: 201 });
        }
        const version = expectedVersion(body.updatedAt);
        const record = await prisma.$transaction(async (tx) => {
            const existing = await tx.changePlan.findFirst({ where: { id: String(body.id), tenantId } });
            if (!existing) throw new PlanningError('Cambio no encontrado.', 404);
            if (!canEditPlan('change', existing.status, plan.status)) throw new PlanningError('El cambio completado conserva su evidencia y no admite edición.', 409);
            const updated = await tx.changePlan.updateMany({ where: { id: existing.id, tenantId, updatedAt: version }, data });
            if (!updated.count) throw new PlanningError('Otra persona actualizó este cambio. Recarga antes de guardar.', 409);
            return tx.changePlan.findUniqueOrThrow({ where: { id: existing.id }, include });
        });
        return NextResponse.json(record);
    } catch (error) { return planningError(error); }
}
