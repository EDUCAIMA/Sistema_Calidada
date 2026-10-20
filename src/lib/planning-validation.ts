import { z } from 'zod';

const required = z.string().trim().min(1, 'Completa los campos obligatorios.').max(5000);
const identifier = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(5000).optional().default('');
const score = z.preprocess((value) => typeof value === 'string' && value.trim() ? Number(value) : value, z.number().int().min(1).max(5));
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa una fecha válida.').refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'La fecha no existe.').transform((value) => new Date(`${value}T00:00:00.000Z`));

export const riskPlanSchema = z.object({
    kind: z.enum(['RIESGO', 'OPORTUNIDAD']),
    description: required,
    sourceType: z.enum(['CONTEXTO', 'PARTE_INTERESADA', 'PROCESO']),
    sourceId: identifier,
    sourceReference: required,
    processId: identifier,
    cause: required,
    consequence: required,
    probability: score,
    impact: score,
    existingControls: required,
    treatmentPlan: required,
    treatmentJustification: required,
    resources: required,
    integrationPlan: required,
    responsibleId: identifier,
    dueDate: dateOnly,
    evaluationMethod: required,
    evaluationDueDate: dateOnly,
    status: z.enum(['ABIERTA', 'EN_PROGRESO']),
}).refine((data) => data.evaluationDueDate >= data.dueDate, {
    message: 'La evaluación debe programarse para la fecha de finalización o después.',
    path: ['evaluationDueDate'],
});

export const changePlanSchema = z.object({
    title: required,
    purpose: required,
    consequences: required,
    integrityMeasures: required,
    resources: required,
    responsibilityChanges: required,
    implementationPlan: required,
    evaluationMethod: required,
    processId: identifier,
    responsibleId: identifier,
    dueDate: dateOnly,
    status: z.enum(['PLANIFICADO', 'EN_EJECUCION']),
});

export const planReviewSchema = z.object({
    result: z.enum(['EFICAZ', 'NO_EFICAZ']),
    evaluation: required,
    evidence: required,
    followUp: optionalText,
    residualProbability: z.preprocess((value) => value === '' || value == null ? undefined : value, score.optional()),
    residualImpact: z.preprocess((value) => value === '' || value == null ? undefined : value, score.optional()),
}).superRefine((data, context) => {
    if (data.result === 'NO_EFICAZ' && !data.followUp) {
        context.addIssue({ code: 'custom', message: 'Indica los ajustes y el seguimiento de la acción no eficaz.', path: ['followUp'] });
    }
    if ((data.residualProbability === undefined) !== (data.residualImpact === undefined)) {
        context.addIssue({ code: 'custom', message: 'Completa ambas valoraciones residuales.', path: ['residualProbability'] });
    }
});

export function riskLevel(probability: number, impact: number): 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO' {
    const value = probability * impact;
    return value >= 15 ? 'CRITICO' : value >= 9 ? 'ALTO' : value >= 4 ? 'MEDIO' : 'BAJO';
}

export function canEditPlan(kind: 'risk' | 'change', currentStatus: string, nextStatus: string) {
    const open = kind === 'risk' ? ['ABIERTA', 'EN_PROGRESO', 'VENCIDA'] : ['PLANIFICADO', 'EN_EJECUCION'];
    return open.includes(currentStatus) && open.slice(0, 2).includes(nextStatus);
}

export function reviewStatus(kind: 'risk' | 'change', currentStatus: string, result: 'EFICAZ' | 'NO_EFICAZ') {
    const execution = kind === 'risk' ? 'EN_PROGRESO' : 'EN_EJECUCION';
    if (currentStatus !== execution) throw new Error('Primero inicia la ejecución del plan. Los registros cerrados no admiten cambios.');
    return result === 'EFICAZ' ? (kind === 'risk' ? 'CERRADA' : 'COMPLETADO') : execution;
}
