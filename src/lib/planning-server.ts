import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import prisma from '@/lib/db';
import { apiError } from '@/lib/api-auth';

export class PlanningError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}

export function planningError(error: unknown) {
    if (error instanceof PlanningError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(' ') }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 400 });
    return apiError(error);
}

export async function planningReferences(tenantId: string, processId: string, responsibleId: string) {
    const [process, responsible] = await Promise.all([
        prisma.process.findFirst({ where: { id: processId, tenantId, active: true }, select: { id: true, name: true } }),
        prisma.user.findFirst({ where: { id: responsibleId, tenantId, active: true }, select: { id: true, name: true } }),
    ]);
    if (!process || !responsible) throw new PlanningError('El proceso y el responsable deben estar activos y pertenecer a la empresa.');
    return { process, responsible };
}

export async function planningMetadata(tenantId: string) {
    const [processes, users, dofa, stakeholders] = await Promise.all([
        prisma.process.findMany({ where: { tenantId, active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        prisma.user.findMany({ where: { tenantId, active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
        prisma.dOFAItem.findMany({ where: { tenantId }, select: { id: true, description: true, category: true } }),
        prisma.stakeholder.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    ]);
    return { processes, users, dofa, stakeholders };
}

export async function validatePlanningSource(tenantId: string, sourceType: string, sourceId: string) {
    const found = sourceType === 'CONTEXTO'
        ? await prisma.dOFAItem.findFirst({ where: { id: sourceId, tenantId }, select: { id: true } })
        : sourceType === 'PARTE_INTERESADA'
            ? await prisma.stakeholder.findFirst({ where: { id: sourceId, tenantId }, select: { id: true } })
            : await prisma.process.findFirst({ where: { id: sourceId, tenantId, active: true }, select: { id: true } });
    if (!found) throw new PlanningError('El origen seleccionado no pertenece a la empresa o ya no está disponible.');
}

export function expectedVersion(value: unknown) {
    if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) throw new PlanningError('Recarga el registro antes de guardar: falta su versión.');
    return new Date(value);
}
