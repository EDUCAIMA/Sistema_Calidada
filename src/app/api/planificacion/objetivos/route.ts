import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { apiError, requireTenantAccess } from '@/lib/api-auth';
import { calculatePlanEvaluationDate, calculateQualityObjectiveStatus, objectivePlanSchema, objectiveVersionSchema } from '@/lib/quality-objectives';

export const dynamic = 'force-dynamic';
const trackingOrder = { orderBy: { date: 'desc' as const } };
const errorResponse = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function GET(req: NextRequest) {
    try {
        const tenantId = new URL(req.url).searchParams.get('tenantId') || '';
        await requireTenantAccess(req, tenantId);
        const objectives = await prisma.qualityObjective.findMany({
            where: { tenantId }, include: { tracking: trackingOrder }, orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(objectives.map((objective) => ({ ...objective, status: calculateQualityObjectiveStatus(objective) })));
    } catch (error) { return apiError(error); }
}

export async function POST(req: NextRequest) {
    try {
        const raw = await req.json();
        const tenantId = typeof raw?.tenantId === 'string' ? raw.tenantId.trim() : '';
        const actor = await requireTenantAccess(req, tenantId, { write: true });
        const parsed = objectivePlanSchema.safeParse(raw);
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
        const body = parsed.data;
        const existing = body.id ? await prisma.qualityObjective.findFirst({ where: { id: body.id, tenantId } }) : null;
        if (body.id && !existing) return errorResponse('Objetivo no encontrado.', 404);
        if (existing?.archivedAt) return errorResponse('Un objetivo archivado conserva su historial y no se puede modificar.', 409);
        if (existing && existing.updatedAt.getTime() !== new Date(body.expectedUpdatedAt!).getTime()) {
            return errorResponse('El objetivo cambió desde que abrió el formulario. Actualice la página y revise los cambios antes de guardar.', 409);
        }
        const [policy, process, responsible] = await Promise.all([
            prisma.policy.findFirst({ where: { id: body.policyId, tenantId } }),
            prisma.process.findFirst({ where: { id: body.processId, tenantId } }),
            prisma.user.findFirst({ where: { id: body.responsibleId, tenantId } }),
        ]);
        if (!policy || (existing?.policyId !== policy.id && (policy.status !== 'VIGENTE' || !['General', 'Calidad'].includes(policy.type)))) {
            return errorResponse('Selecciona una política de calidad vigente de la empresa. Las asociaciones históricas existentes se conservan.');
        }
        if (!process || (!process.active && existing?.processId !== process.id)) return errorResponse('Selecciona un proceso activo de la empresa.');
        if (!responsible || (!responsible.active && existing?.responsibleId !== responsible.id)) return errorResponse('Selecciona un responsable activo de la empresa.');
        const deadline = new Date(`${body.deadline}T00:00:00.000Z`);
        const criteriaChanged = Boolean(existing && (existing.description !== body.description || existing.indicator !== body.indicator || existing.target !== body.target || existing.evaluationMethod !== body.evaluationMethod || existing.processId !== body.processId));
        // Editar un plan no aplaza seguimientos vencidos ni altera mediciones registradas.
        const nextEvaluationDate = calculatePlanEvaluationDate(body.evaluationFreq, existing);
        const targetMet = criteriaChanged ? null : existing?.targetMet ?? null;
        const progress = existing?.progress ?? 0;
        const data = {
            tenantId, policyId: body.policyId, processId: body.processId, organizationalLevel: body.organizationalLevel,
            description: body.description, indicator: body.indicator, target: body.target,
            actual: existing ? existing.actual : body.actual || null,
            applicableRequirements: body.applicableRequirements, relevance: body.relevance,
            actionPlan: body.actionPlan, evaluationMethod: body.evaluationMethod,
            resources: body.resources, responsibleId: body.responsibleId, responsibleName: responsible.name,
            deadline, evaluationFreq: body.evaluationFreq, nextEvaluationDate,
            communicationRecipients: body.communicationRecipients,
            communicationDate: new Date(`${body.communicationDate}T00:00:00.000Z`),
            communicationEvidence: body.communicationEvidence, targetMet, progress,
            status: calculateQualityObjectiveStatus({ deadline, nextEvaluationDate, targetMet }),
        };
        const result = await prisma.$transaction(async (tx) => {
            const objective = existing
                ? await tx.qualityObjective.update({ where: { id: existing.id, updatedAt: new Date(body.expectedUpdatedAt!), archivedAt: null }, data })
                : await tx.qualityObjective.create({ data });
            await tx.objectiveTracking.create({ data: {
                objectiveId: objective.id, eventType: existing ? 'PLAN_UPDATED' : 'PLAN_CREATED',
                note: existing ? body.changeReason! : 'Planificación inicial del objetivo.',
                progress, actual: objective.actual, targetMet, actorId: actor.id, actorName: actor.name,
                snapshot: JSON.parse(JSON.stringify({ before: existing || null, after: { ...data, policyTitle: policy.title, processName: process.name } })),
            } });
            return tx.qualityObjective.findUniqueOrThrow({ where: { id: objective.id }, include: { tracking: trackingOrder } });
        });
        return NextResponse.json(result, { status: existing ? 200 : 201 });
    } catch (error) { return apiError(error); }
}

// Archivar conserva la planificación y las mediciones como información documentada.
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get('tenantId') || '';
        const actor = await requireTenantAccess(req, tenantId, { admin: true, write: true });
        const id = searchParams.get('id');
        if (!id) return errorResponse('El identificador del objetivo es obligatorio.');
        const expectedUpdatedAt = objectiveVersionSchema.parse(searchParams.get('expectedUpdatedAt'));
        const existing = await prisma.qualityObjective.findFirst({ where: { id, tenantId } });
        if (!existing) return errorResponse('Objetivo no encontrado.', 404);
        if (existing.archivedAt) return errorResponse('El objetivo ya está archivado.', 409);
        if (existing.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
            return errorResponse('El objetivo cambió. Actualice la página y revise la versión actual antes de archivarlo.', 409);
        }
        const objective = await prisma.$transaction(async (tx) => {
            await tx.qualityObjective.update({ where: { id, updatedAt: new Date(expectedUpdatedAt), archivedAt: null }, data: { archivedAt: new Date(), status: 'ARCHIVADO' } });
            await tx.objectiveTracking.create({ data: {
                objectiveId: id, eventType: 'ARCHIVED', note: 'Objetivo archivado; se conserva el historial.',
                progress: existing.progress, actual: existing.actual, targetMet: existing.targetMet, actorId: actor.id, actorName: actor.name,
            } });
            return tx.qualityObjective.findUniqueOrThrow({ where: { id }, include: { tracking: trackingOrder } });
        });
        return NextResponse.json(objective);
    } catch (error) { return apiError(error); }
}
