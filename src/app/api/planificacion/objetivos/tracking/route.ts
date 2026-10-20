import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { apiError, requireTenantAccess } from '@/lib/api-auth';
import { calculateNextEvaluationDate, calculateQualityObjectiveStatus, objectiveTrackingSchema } from '@/lib/quality-objectives';

export async function POST(req: NextRequest) {
    try {
        const raw = await req.json();
        const tenantId = typeof raw?.tenantId === 'string' ? raw.tenantId.trim() : '';
        const actor = await requireTenantAccess(req, tenantId, { write: true });
        const parsed = objectiveTrackingSchema.safeParse(raw);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        const { objectiveId, note, actual, evidence, progress, targetMet, expectedUpdatedAt } = parsed.data;
        const objective = await prisma.qualityObjective.findFirst({ where: { id: objectiveId, tenantId } });
        if (!objective) return NextResponse.json({ error: 'Objetivo no encontrado.' }, { status: 404 });
        if (objective.archivedAt) return NextResponse.json({ error: 'No se registran mediciones sobre objetivos archivados.' }, { status: 409 });
        if (objective.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
            return NextResponse.json({ error: 'El objetivo cambió desde que abrió el seguimiento. Actualice la página y evalúe la versión actual.' }, { status: 409 });
        }
        if (!objective.evaluationMethod || !objective.actionPlan) return NextResponse.json({ error: 'Completa el plan de acciones y el método de evaluación antes de registrar resultados.' }, { status: 409 });
        const nextEvaluationDate = calculateNextEvaluationDate(objective.evaluationFreq);
        if (!nextEvaluationDate) return NextResponse.json({ error: 'Actualiza la frecuencia de evaluación del objetivo.' }, { status: 409 });
        const status = calculateQualityObjectiveStatus({ targetMet, deadline: objective.deadline, nextEvaluationDate });
        const result = await prisma.$transaction(async (tx) => {
            await tx.qualityObjective.update({ where: { id: objectiveId, updatedAt: new Date(expectedUpdatedAt), archivedAt: null }, data: { actual, progress, targetMet, status, nextEvaluationDate } });
            const tracking = await tx.objectiveTracking.create({ data: {
                objectiveId, note, progress, actual, evidence, targetMet, eventType: 'MEASUREMENT', actorId: actor.id, actorName: actor.name,
                snapshot: { indicator: objective.indicator, target: objective.target, evaluationMethod: objective.evaluationMethod },
            } });
            const updatedObjective = await tx.qualityObjective.findUniqueOrThrow({ where: { id: objectiveId }, include: { tracking: { orderBy: { date: 'desc' } } } });
            return { tracking, objective: updatedObjective };
        });
        return NextResponse.json(result);
    } catch (error) { return apiError(error); }
}
