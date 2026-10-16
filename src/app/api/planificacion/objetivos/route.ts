import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
    calculateNextEvaluationDate,
    calculateQualityObjectiveStatus,
} from '@/lib/quality-objectives';

export const dynamic = 'force-dynamic';

const REQUIRED_FIELDS = [
    ['description', 'descripción'],
    ['indicator', 'indicador'],
    ['target', 'meta'],
    ['policyId', 'política de calidad'],
    ['processId', 'proceso'],
    ['organizationalLevel', 'nivel organizacional'],
    ['applicableRequirements', 'requisitos aplicables'],
    ['relevance', 'relevancia para la conformidad y el cliente'],
    ['resources', 'recursos'],
    ['responsibleId', 'responsable'],
    ['deadline', 'fecha límite'],
    ['evaluationFreq', 'frecuencia de evaluación'],
    ['communicationRecipients', 'destinatarios de la comunicación'],
    ['communicationDate', 'fecha de comunicación'],
] as const;

function text(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function validDate(value: unknown) {
    if (!value || typeof value !== 'string') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

async function validateReferences(
    tenantId: string,
    policyId: string,
    processId: string,
    responsibleId: string,
) {
    const [policy, process, responsible] = await Promise.all([
        prisma.policy.findFirst({ where: { id: policyId, tenantId } }),
        prisma.process.findFirst({ where: { id: processId, tenantId, active: true } }),
        prisma.user.findFirst({ where: { id: responsibleId, tenantId, active: true } }),
    ]);

    if (!policy) return { error: 'La política seleccionada no pertenece a la empresa.' };
    if (!process) return { error: 'El proceso seleccionado no pertenece a la empresa o está inactivo.' };
    if (!responsible) return { error: 'El responsable seleccionado no pertenece a la empresa o está inactivo.' };
    return { responsible };
}

export async function GET(req: NextRequest) {
    const tenantId = new URL(req.url).searchParams.get('tenantId');
    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    try {
        const objectives = await prisma.qualityObjective.findMany({
            where: { tenantId },
            include: { tracking: { orderBy: { date: 'desc' } } },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(objectives.map((objective) => ({
            ...objective,
            status: calculateQualityObjectiveStatus({
                progress: objective.progress,
                deadline: objective.deadline,
                nextEvaluationDate: objective.nextEvaluationDate,
            }),
        })));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error fetching objectives';
        console.error('Error fetching objectives:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const tenantId = text(body.tenantId);
        if (!tenantId) {
            return NextResponse.json({ error: 'La empresa es obligatoria.' }, { status: 400 });
        }

        const missing = REQUIRED_FIELDS
            .filter(([key]) => !text(body[key]))
            .map(([, label]) => label);
        if (missing.length) {
            return NextResponse.json(
                { error: `Completa los campos requeridos: ${missing.join(', ')}.` },
                { status: 400 },
            );
        }

        const deadline = validDate(body.deadline);
        const communicationDate = validDate(body.communicationDate);
        if (!deadline || !communicationDate) {
            return NextResponse.json({ error: 'Las fechas ingresadas no son válidas.' }, { status: 400 });
        }

        const references = await validateReferences(
            tenantId,
            text(body.policyId),
            text(body.processId),
            text(body.responsibleId),
        );
        if ('error' in references) {
            return NextResponse.json({ error: references.error }, { status: 400 });
        }

        const objectiveId = text(body.id);
        const existing = objectiveId
            ? await prisma.qualityObjective.findFirst({ where: { id: objectiveId, tenantId } })
            : null;
        if (objectiveId && !existing) {
            return NextResponse.json({ error: 'Objetivo no encontrado.' }, { status: 404 });
        }

        const suppliedProgress = body.progress === undefined ? existing?.progress ?? 0 : Number(body.progress);
        const progress = Math.min(100, Math.max(0, Number.isFinite(suppliedProgress) ? suppliedProgress : 0));
        const nextEvaluationDate = calculateNextEvaluationDate(text(body.evaluationFreq));
        const status = calculateQualityObjectiveStatus({ progress, deadline, nextEvaluationDate });
        const data = {
            tenantId,
            policyId: text(body.policyId),
            processId: text(body.processId),
            organizationalLevel: text(body.organizationalLevel),
            description: text(body.description),
            indicator: text(body.indicator),
            target: text(body.target),
            actual: text(body.actual) || null,
            applicableRequirements: text(body.applicableRequirements),
            relevance: text(body.relevance),
            resources: text(body.resources),
            responsibleId: text(body.responsibleId),
            responsibleName: references.responsible.name,
            deadline,
            evaluationFreq: text(body.evaluationFreq),
            nextEvaluationDate,
            communicationRecipients: text(body.communicationRecipients),
            communicationDate,
            communicationEvidence: text(body.communicationEvidence) || null,
            status,
            progress,
        };

        if (existing) {
            const updated = await prisma.qualityObjective.update({
                where: { id: existing.id },
                data,
                include: { tracking: { orderBy: { date: 'desc' } } },
            });
            return NextResponse.json(updated);
        }

        const created = await prisma.qualityObjective.create({
            data,
            include: { tracking: true },
        });
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error('Error saving objective:', error);
        return NextResponse.json({ error: 'Error al guardar el objetivo.' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const tenantId = searchParams.get('tenantId');
    if (!id || !tenantId) {
        return NextResponse.json({ error: 'ID y empresa son obligatorios.' }, { status: 400 });
    }

    try {
        const result = await prisma.qualityObjective.deleteMany({ where: { id, tenantId } });
        if (!result.count) {
            return NextResponse.json({ error: 'Objetivo no encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting objective:', error);
        return NextResponse.json({ error: 'Error al eliminar el objetivo.' }, { status: 500 });
    }
}
