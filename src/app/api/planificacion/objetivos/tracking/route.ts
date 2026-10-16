import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
    calculateNextEvaluationDate,
    calculateQualityObjectiveStatus,
} from '@/lib/quality-objectives';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const objectiveId = typeof body.objectiveId === 'string' ? body.objectiveId : '';
        const tenantId = typeof body.tenantId === 'string' ? body.tenantId : '';
        const note = typeof body.note === 'string' ? body.note.trim() : '';
        const actual = typeof body.actual === 'string' ? body.actual.trim() : '';
        const progress = Number(body.progress);

        if (!objectiveId || !tenantId || !note || !actual) {
            return NextResponse.json(
                { error: 'Objetivo, empresa, resultado actual y nota son obligatorios.' },
                { status: 400 },
            );
        }
        if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
            return NextResponse.json({ error: 'El progreso debe estar entre 0 y 100.' }, { status: 400 });
        }

        const objective = await prisma.qualityObjective.findFirst({
            where: { id: objectiveId, tenantId },
        });
        if (!objective) {
            return NextResponse.json({ error: 'Objetivo no encontrado.' }, { status: 404 });
        }

        const nextEvaluationDate = calculateNextEvaluationDate(objective.evaluationFreq);
        const status = calculateQualityObjectiveStatus({
            progress,
            deadline: objective.deadline,
            nextEvaluationDate,
        });

        const [tracking, updatedObjective] = await prisma.$transaction([
            prisma.objectiveTracking.create({ data: { objectiveId, note, progress, actual } }),
            prisma.qualityObjective.update({
                where: { id: objectiveId },
                data: { actual, progress, status, nextEvaluationDate },
                include: { tracking: { orderBy: { date: 'desc' } } },
            }),
        ]);

        return NextResponse.json({ tracking, objective: updatedObjective });
    } catch (error) {
        console.error('Error saving tracking:', error);
        return NextResponse.json({ error: 'Error al guardar el seguimiento.' }, { status: 500 });
    }
}
