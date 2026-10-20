import { z } from 'zod';

export const QUALITY_OBJECTIVE_STATUSES = {
  IN_PROGRESS: 'EN_PROGRESO',
  COMPLETED: 'CUMPLIDO',
  AT_RISK: 'EN_RIESGO',
  LATE: 'ATRASADO',
  ARCHIVED: 'ARCHIVADO',
} as const;

export const EVALUATION_FREQUENCIES = ['Mensual', 'Trimestral', 'Semestral', 'Anual'] as const;
export const objectiveVersionSchema = z.iso.datetime('La versión del objetivo es obligatoria y debe ser una fecha ISO válida. Actualice la página.');

const requiredText = z.string().trim().min(1, 'Completa los campos obligatorios.').max(5000, 'El texto excede 5000 caracteres.');
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa una fecha válida.').refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'La fecha no existe.');

export const objectivePlanSchema = z.object({
  id: z.string().trim().min(1).nullish(),
  expectedUpdatedAt: objectiveVersionSchema.optional(),
  tenantId: requiredText,
  policyId: requiredText,
  processId: requiredText,
  responsibleId: requiredText,
  organizationalLevel: requiredText,
  description: requiredText.max(500),
  indicator: requiredText,
  target: requiredText,
  actual: z.string().trim().max(5000).optional(),
  applicableRequirements: requiredText,
  relevance: requiredText,
  actionPlan: requiredText,
  evaluationMethod: requiredText,
  resources: requiredText,
  deadline: dateOnly,
  evaluationFreq: z.enum(EVALUATION_FREQUENCIES, 'Selecciona una frecuencia válida.'),
  communicationRecipients: requiredText,
  communicationDate: dateOnly,
  communicationEvidence: requiredText,
  changeReason: z.string().trim().max(5000).optional(),
}).superRefine((value, context) => {
  if (value.communicationDate > new Date().toISOString().slice(0, 10)) {
    context.addIssue({ code: 'custom', path: ['communicationDate'], message: 'Registra la fecha real de comunicación, no una fecha futura.' });
  }
  if (value.communicationDate > value.deadline) {
    context.addIssue({ code: 'custom', path: ['communicationDate'], message: 'La comunicación no puede ser posterior al plazo del objetivo.' });
  }
  if (value.id && !value.changeReason) {
    context.addIssue({ code: 'custom', path: ['changeReason'], message: 'Explica el motivo de la actualización para conservar la trazabilidad.' });
  }
  if (value.id && !value.expectedUpdatedAt) {
    context.addIssue({ code: 'custom', path: ['expectedUpdatedAt'], message: 'La versión del objetivo es obligatoria. Actualice la página antes de editar.' });
  }
});

export const objectiveTrackingSchema = z.object({
  tenantId: requiredText,
  objectiveId: requiredText,
  expectedUpdatedAt: objectiveVersionSchema,
  note: requiredText,
  actual: requiredText,
  evidence: requiredText,
  progress: z.number().int('El avance debe ser un número entero.').min(0).max(100),
  targetMet: z.boolean('Indica si el resultado cumple la meta.'),
});

export function calculateNextEvaluationDate(
  frequency?: string | null,
  baseDate = new Date(),
) {
  const monthsByFrequency: Record<string, number> = {
    Mensual: 1,
    Trimestral: 3,
    Semestral: 6,
    Anual: 12,
  };
  const months = frequency ? monthsByFrequency[frequency] : undefined;
  if (!months) return null;

  // Conservar el día o el último día del mes, sin desbordar febrero a marzo.
  const nextDate = new Date(baseDate);
  const day = nextDate.getUTCDate();
  nextDate.setUTCDate(1);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, 0)).getUTCDate();
  nextDate.setUTCDate(Math.min(day, lastDay));
  return nextDate;
}

export function calculatePlanEvaluationDate(
  frequency: string,
  existing?: { evaluationFreq: string | null; nextEvaluationDate: Date | null } | null,
  now = new Date(),
) {
  if (existing?.evaluationFreq === frequency) return existing.nextEvaluationDate;
  const calculated = calculateNextEvaluationDate(frequency, now);
  if (!existing?.nextEvaluationDate) return calculated;
  // Una frecuencia más corta adelanta la revisión; ninguna edición prorroga una ya programada.
  return calculated && calculated.getTime() < existing.nextEvaluationDate.getTime()
    ? calculated
    : existing.nextEvaluationDate;
}

export function calculateQualityObjectiveStatus({
  targetMet,
  archivedAt,
  deadline,
  nextEvaluationDate,
  now = new Date(),
}: {
  progress?: number;
  targetMet?: boolean | null;
  archivedAt?: Date | null;
  deadline: Date;
  nextEvaluationDate?: Date | null;
  now?: Date;
}) {
  if (archivedAt) return QUALITY_OBJECTIVE_STATUSES.ARCHIVED;
  if (targetMet === true) return QUALITY_OBJECTIVE_STATUSES.COMPLETED;
  // Un plazo de fecha completa vence al finalizar el día, no a medianoche.
  if (deadline.toISOString().slice(0, 10) < now.toISOString().slice(0, 10)) return QUALITY_OBJECTIVE_STATUSES.LATE;
  if (nextEvaluationDate && nextEvaluationDate.getTime() < now.getTime()) {
    return QUALITY_OBJECTIVE_STATUSES.AT_RISK;
  }
  return QUALITY_OBJECTIVE_STATUSES.IN_PROGRESS;
}
