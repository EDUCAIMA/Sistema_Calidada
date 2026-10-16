export const QUALITY_OBJECTIVE_STATUSES = {
  IN_PROGRESS: 'EN_PROGRESO',
  COMPLETED: 'CUMPLIDO',
  AT_RISK: 'EN_RIESGO',
  LATE: 'ATRASADO',
} as const;

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

  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

export function calculateQualityObjectiveStatus({
  progress,
  deadline,
  nextEvaluationDate,
  now = new Date(),
}: {
  progress: number;
  deadline: Date;
  nextEvaluationDate?: Date | null;
  now?: Date;
}) {
  if (progress >= 100) return QUALITY_OBJECTIVE_STATUSES.COMPLETED;
  if (deadline.getTime() < now.getTime()) return QUALITY_OBJECTIVE_STATUSES.LATE;
  if (nextEvaluationDate && nextEvaluationDate.getTime() < now.getTime()) {
    return QUALITY_OBJECTIVE_STATUSES.AT_RISK;
  }
  return QUALITY_OBJECTIVE_STATUSES.IN_PROGRESS;
}
