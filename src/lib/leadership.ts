import { z } from 'zod';

export const LEADERSHIP_CATEGORIES = {
  RESPONSABILIDAD: '5.1.1 a · Rendición de cuentas sobre la eficacia del SGC',
  POLITICA_OBJETIVOS: '5.1.1 b · Política y objetivos alineados con la organización',
  INTEGRACION: '5.1.1 c · Integración del SGC en los procesos de negocio',
  PROCESOS_RIESGOS: '5.1.1 d · Enfoque a procesos y pensamiento basado en riesgos',
  RECURSOS: '5.1.1 e · Disponibilidad de recursos',
  COMUNICACION: '5.1.1 f · Comunicación de la gestión de calidad',
  RESULTADOS: '5.1.1 g · Logro de resultados previstos',
  PERSONAS: '5.1.1 h · Participación y apoyo a las personas',
  MEJORA: '5.1.1 i · Promoción de la mejora',
  APOYO_DIRECCION: '5.1.1 j · Apoyo a otros roles de dirección',
  CLIENTE: '5.1.2 · Enfoque al cliente',
} as const;

export const SGC_DUTIES = {
  CONFORMIDAD: '5.3 a · Asegurar la conformidad del SGC',
  SALIDAS_PROCESOS: '5.3 b · Asegurar las salidas previstas de los procesos',
  INFORMAR_DESEMPENO: '5.3 c · Informar a la dirección sobre desempeño y mejora',
  ENFOQUE_CLIENTE: '5.3 d · Promover el enfoque al cliente',
  INTEGRIDAD_CAMBIOS: '5.3 e · Mantener la integridad del SGC ante cambios',
} as const;

export const RACI_ROLES = {
  RESPONSABLE: 'R · Ejecuta y entrega el resultado',
  APRUEBA: 'A · Responde por el resultado y toma la decisión final',
  CONSULTADO: 'C · Aporta criterio antes de la decisión',
  INFORMADO: 'I · Debe conocer el resultado o la decisión',
} as const;

export const RESPONSIBILITY_MATRIX_STATUSES = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En revisión',
  VIGENTE: 'Vigente',
  OBSOLETA: 'Obsoleta',
} as const;

export const COMMITMENT_STATUSES = {
  ABIERTA: 'Abierta', EN_CURSO: 'En curso', CERRADA: 'Cerrada',
} as const;

const text = (min = 1, max = 6000) => z.string().trim().min(min, 'Complete los campos obligatorios.').max(max, `Máximo ${max} caracteres.`);
const optionalText = z.string().trim().max(6000).default('');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use una fecha válida.').refine(value => {
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Use una fecha válida.');

export const leadershipCommitmentSchema = z.object({
  category: z.enum(Object.keys(LEADERSHIP_CATEGORIES) as [keyof typeof LEADERSHIP_CATEGORIES, ...(keyof typeof LEADERSHIP_CATEGORIES)[]]),
  title: text(3, 200),
  description: text(10),
  responsibleId: text(1, 200),
  dueDate: date,
  status: z.enum(['ABIERTA', 'EN_CURSO', 'CERRADA']),
  evidence: optionalText,
  result: optionalText,
  customerRequirements: optionalText,
  customerRisks: optionalText,
  customerSatisfaction: optionalText,
}).superRefine((value, ctx) => {
  if (value.status === 'CERRADA') {
    for (const field of ['evidence', 'result'] as const) {
      if (value[field].length < 10) ctx.addIssue({ code: 'custom', path: [field], message: 'Para cerrar, registre evidencia verificable y una evaluación de resultados (mínimo 10 caracteres).' });
    }
  }
  if (value.category === 'CLIENTE') {
    for (const field of ['customerRequirements', 'customerRisks', 'customerSatisfaction'] as const) {
      if (value[field].length < 10) ctx.addIssue({ code: 'custom', path: [field], message: 'Describa los requisitos, riesgos y seguimiento de satisfacción del cliente (mínimo 10 caracteres por campo).' });
    }
  }
});

export const responsibilityAssignmentSchema = z.object({
  matrixId: text(1, 200).optional(),
  processId: text(1, 200),
  title: text(3, 200),
  department: text(2, 200),
  assignedToId: text(1, 200),
  reportsTo: text(2, 200),
  responsibilities: text(10),
  authorities: text(10),
  raciRoles: z.array(z.enum(Object.keys(RACI_ROLES) as [keyof typeof RACI_ROLES, ...(keyof typeof RACI_ROLES)[]]))
    .min(1, 'Seleccione al menos una función RACI.')
    .max(4)
    .transform(value => [...new Set(value)]),
  sgcDuties: z.array(z.enum(Object.keys(SGC_DUTIES) as [keyof typeof SGC_DUTIES, ...(keyof typeof SGC_DUTIES)[]])).max(5).transform(value => [...new Set(value)]),
  active: z.boolean().default(true),
});

export const responsibilityCommunicationSchema = z.object({
  tenantId: text(1, 200),
  id: text(1, 200),
  expectedUpdatedAt: z.iso.datetime(),
  action: z.literal('COMMUNICATE'),
  communicatedAt: date,
  communicationMethod: text(3, 200),
  communicationAudience: text(3, 1000),
  communicationEvidence: text(10),
}).superRefine((value, ctx) => {
  if (value.communicatedAt > new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: 'custom', path: ['communicatedAt'], message: 'La comunicación no puede tener una fecha futura.' });
  }
});

export const responsibilityMatrixActionSchema = z.object({
  tenantId: text(1, 200),
  matrixId: text(1, 200),
  expectedUpdatedAt: z.iso.datetime(),
  action: z.enum(['SUBMIT_MATRIX', 'RETURN_TO_DRAFT', 'CREATE_REVISION']),
  note: optionalText,
});

export const responsibilityMatrixApprovalSchema = z.object({
  tenantId: text(1, 200),
  matrixId: text(1, 200),
  expectedUpdatedAt: z.iso.datetime(),
  action: z.literal('APPROVE_MATRIX'),
  approvalNote: text(10, 2000),
  nextReviewAt: date,
}).superRefine((value, ctx) => {
  if (value.nextReviewAt <= new Date().toISOString().slice(0, 10)) {
    ctx.addIssue({ code: 'custom', path: ['nextReviewAt'], message: 'La próxima revisión debe ser posterior a hoy.' });
  }
});

export const leadershipMutationSchema = z.object({
  tenantId: text(1, 200),
  id: text(1, 200),
  expectedUpdatedAt: z.iso.datetime(),
});

export type LeadershipCommitmentInput = z.infer<typeof leadershipCommitmentSchema>;
export type ResponsibilityAssignmentInput = z.infer<typeof responsibilityAssignmentSchema>;
export type ResponsibilityCommunicationInput = z.infer<typeof responsibilityCommunicationSchema>;

export interface ResponsibilityCoverageRecord {
  id: string;
  active: boolean;
  processId: string | null;
  assignedToId: string;
  title?: unknown;
  department?: unknown;
  reportsTo?: unknown;
  responsibilities?: unknown;
  authorities?: unknown;
  raciRoles: unknown;
  sgcDuties: unknown;
  communicatedAt?: unknown;
  communicationMethod?: unknown;
  communicationAudience?: unknown;
  communicationEvidence?: unknown;
  acknowledgedAt?: unknown;
  acknowledgedById?: unknown;
  understandingEvidence?: unknown;
}

export interface ResponsibilityCoverageProcess {
  id: string;
  responsibleId: string;
}

export function evaluateResponsibilityMatrix(
  records: ResponsibilityCoverageRecord[],
  activeProcesses: ResponsibilityCoverageProcess[],
  activeUserIds: string[],
  matrixStatus = 'BORRADOR',
) {
  const active = records.filter(record => record.active);
  const activeUsers = new Set(activeUserIds);
  const processRows = new Map(activeProcesses.map(process => [process.id, {
    responsibleId: process.responsibleId,
    responsible: false,
    accountable: false,
  }]));
  const dutySet = new Set<string>();
  const invalidProcessAssignmentIds: string[] = [];
  const staleResponsibleAssignmentIds: string[] = [];
  const incompleteAssignmentIds: string[] = [];

  const completeText = (value: unknown, minimum: number) => typeof value === 'string' && value.trim().length >= minimum;

  for (const record of active) {
    const roles = Array.isArray(record.raciRoles)
      ? record.raciRoles.filter((value): value is keyof typeof RACI_ROLES => typeof value === 'string' && value in RACI_ROLES)
      : [];
    const coverage = record.processId ? processRows.get(record.processId) : undefined;
    const complete = completeText(record.title, 3)
      && completeText(record.department, 2)
      && completeText(record.reportsTo, 2)
      && completeText(record.responsibilities, 10)
      && completeText(record.authorities, 10)
      && completeText(record.assignedToId, 1)
      && roles.length > 0;
    if (!complete) incompleteAssignmentIds.push(record.id);
    if (!coverage) invalidProcessAssignmentIds.push(record.id);

    const staleResponsible = Boolean(coverage && roles.includes('RESPONSABLE') && coverage.responsibleId !== record.assignedToId);
    if (staleResponsible) staleResponsibleAssignmentIds.push(record.id);

    const validAssignee = activeUsers.has(record.assignedToId);
    if (!coverage || !complete || !validAssignee || staleResponsible) continue;
    if (roles.includes('RESPONSABLE')) coverage.responsible = true;
    if (roles.includes('APRUEBA')) coverage.accountable = true;
    if (roles.includes('RESPONSABLE') || roles.includes('APRUEBA')) {
      for (const duty of Array.isArray(record.sgcDuties) ? record.sgcDuties : []) {
        if (typeof duty === 'string' && duty in SGC_DUTIES) dutySet.add(duty);
      }
    }
  }

  const missingDuties = Object.keys(SGC_DUTIES).filter(key => !dutySet.has(key));
  const missingResponsibleProcessIds = [...processRows].filter(([, value]) => !value.responsible).map(([id]) => id);
  const missingAccountableProcessIds = [...processRows].filter(([, value]) => !value.accountable).map(([id]) => id);
  const inactiveAssigneeIds = [...new Set(active.filter(record => !activeUsers.has(record.assignedToId)).map(record => record.assignedToId))];
  const uncommunicatedIds = active.filter(record => !record.communicatedAt
    || !completeText(record.communicationMethod, 3)
    || !completeText(record.communicationAudience, 3)
    || !completeText(record.communicationEvidence, 10)).map(record => record.id);
  const unacknowledgedIds = active.filter(record => !record.acknowledgedAt
    || record.acknowledgedById !== record.assignedToId
    || !completeText(record.understandingEvidence, 10)).map(record => record.id);
  const structuralReady = active.length > 0 && missingDuties.length === 0 && missingResponsibleProcessIds.length === 0
    && missingAccountableProcessIds.length === 0 && inactiveAssigneeIds.length === 0
    && invalidProcessAssignmentIds.length === 0 && staleResponsibleAssignmentIds.length === 0
    && incompleteAssignmentIds.length === 0;

  let implementationStatus = matrixStatus;
  if (matrixStatus === 'VIGENTE') {
    implementationStatus = !structuralReady ? 'REQUIERE_REVISION'
      : uncommunicatedIds.length ? 'PENDIENTE_COMUNICACION'
      : unacknowledgedIds.length ? 'PENDIENTE_COMPRENSION'
      : 'IMPLEMENTADA';
  }

  return {
    assignmentCount: active.length,
    missingDuties,
    missingResponsibleProcessIds,
    missingAccountableProcessIds,
    inactiveAssigneeIds,
    invalidProcessAssignmentIds,
    staleResponsibleAssignmentIds,
    incompleteAssignmentIds,
    uncommunicatedIds,
    unacknowledgedIds,
    structuralReady,
    implementationStatus,
  };
}

export function assignmentContentChanged(
  previous: { processId: string | null; title: string; department: string; assignedToId: string; reportsTo: string; responsibilities: string; authorities: string; raciRoles: unknown; sgcDuties: unknown },
  next: ResponsibilityAssignmentInput,
) {
  return (['processId', 'title', 'department', 'assignedToId', 'reportsTo', 'responsibilities', 'authorities'] as const).some(key => previous[key] !== next[key])
    || JSON.stringify(Array.isArray(previous.raciRoles) ? [...previous.raciRoles].sort() : []) !== JSON.stringify([...next.raciRoles].sort())
    || JSON.stringify(Array.isArray(previous.sgcDuties) ? [...previous.sgcDuties].sort() : []) !== JSON.stringify([...next.sgcDuties].sort());
}
