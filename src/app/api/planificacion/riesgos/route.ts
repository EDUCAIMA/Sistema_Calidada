import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { requireTenantAccess } from '@/lib/api-auth';
import { canEditPlan, planReviewSchema, reviewStatus, riskLevel, riskPlanSchema } from '@/lib/planning-validation';
import { expectedVersion, PlanningError, planningError, planningMetadata, planningReferences, validatePlanningSource } from '@/lib/planning-server';

export const dynamic = 'force-dynamic';
const include = { reviews: { orderBy: { createdAt: 'desc' as const } } };

export async function GET(request: NextRequest) {
    try {
        const tenantId = new URL(request.url).searchParams.get('tenantId') || '';
        await requireTenantAccess(request, tenantId);
        const [records, metadata] = await Promise.all([
            prisma.risk.findMany({ where: { tenantId }, include, orderBy: { updatedAt: 'desc' } }),
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
                const existing = await tx.risk.findFirst({ where: { id: String(body.id || ''), tenantId } });
                if (!existing) throw new PlanningError('Registro no encontrado.', 404);
                let status: string;
                try { status = reviewStatus('risk', existing.status, review.result); }
                catch (error) { throw new PlanningError((error as Error).message, 409); }
                // Los registros históricos incompletos deben completar su plan antes de evaluarse.
                riskPlanSchema.parse({ ...existing, dueDate: existing.dueDate?.toISOString().slice(0, 10), evaluationDueDate: existing.evaluationDueDate?.toISOString().slice(0, 10) });
                if (existing.kind === 'RIESGO' && review.residualProbability === undefined) throw new PlanningError('Valora la probabilidad y el impacto residual para evaluar el riesgo.');
                const residualProbability = existing.kind === 'RIESGO' ? review.residualProbability : undefined;
                const residualImpact = existing.kind === 'RIESGO' ? review.residualImpact : undefined;
                const updated = await tx.risk.updateMany({
                    where: { id: existing.id, tenantId, updatedAt: version, status: existing.status },
                    data: {
                        status: status as 'CERRADA' | 'EN_PROGRESO',
                        ...(residualProbability && residualImpact ? {
                            residualProbability, residualImpact,
                            residualLevel: riskLevel(residualProbability, residualImpact),
                        } : {}),
                    },
                });
                if (!updated.count) throw new PlanningError('Otra persona actualizó este registro. Recarga antes de guardar.', 409);
                await tx.riskReview.create({ data: {
                    riskId: existing.id, result: review.result, evaluation: review.evaluation, evidence: review.evidence,
                    followUp: review.followUp || null, residualProbability, residualImpact,
                    userId: actor.id, userName: actor.name,
                    planSnapshot: JSON.parse(JSON.stringify(existing)) as Prisma.InputJsonValue,
                } });
                return tx.risk.findUniqueOrThrow({ where: { id: existing.id }, include });
            });
            return NextResponse.json(record);
        }
        const plan = riskPlanSchema.parse(body);
        const { process, responsible } = await planningReferences(tenantId, plan.processId, plan.responsibleId);
        await validatePlanningSource(tenantId, plan.sourceType, plan.sourceId);
        const data = {
            ...plan, tenantId, processName: process.name, responsible: responsible.name,
            level: riskLevel(plan.probability, plan.impact), riskValue: plan.probability * plan.impact,
        };
        if (!body.id) {
            if (plan.status !== 'ABIERTA') throw new PlanningError('El registro nuevo debe comenzar como planificado.');
            return NextResponse.json(await prisma.risk.create({ data: { ...data, type: 'CALIDAD', createdBy: actor.id, createdByName: actor.name }, include }), { status: 201 });
        }
        const version = expectedVersion(body.updatedAt);
        const record = await prisma.$transaction(async (tx) => {
            const existing = await tx.risk.findFirst({ where: { id: String(body.id), tenantId } });
            if (!existing) throw new PlanningError('Registro no encontrado.', 404);
            if (!canEditPlan('risk', existing.status, plan.status)) throw new PlanningError('El registro cerrado conserva su evidencia y no admite edición.', 409);
            if (existing.kind !== plan.kind) throw new PlanningError('No se puede convertir un riesgo en oportunidad ni a la inversa. Crea un registro separado.');
            const updated = await tx.risk.updateMany({ where: { id: existing.id, tenantId, updatedAt: version }, data });
            if (!updated.count) throw new PlanningError('Otra persona actualizó este registro. Recarga antes de guardar.', 409);
            return tx.risk.findUniqueOrThrow({ where: { id: existing.id }, include });
        });
        return NextResponse.json(record);
    } catch (error) { return planningError(error); }
}
