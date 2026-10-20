import { z } from 'zod';

const text = (label: string, max = 2000) => z.string().trim().min(1, label + ' es obligatorio.').max(max, label + ' es demasiado largo.');
const id = text('Identificador', 100);
export const policyInput = z.object({
  tenantId: id, id: id.optional(), title: text('Título', 200), content: text('Contenido', 20000),
  type: text('Tipo', 60).default('General'),
  version: z.string().regex(/^\d+(\.\d+)?$/, 'La versión debe ser numérica, por ejemplo 1.0.'),
  supersedesId: id.nullish(),
  objectives: z.array(text('Compromiso o marco de objetivos', 1000)).max(30).default([]),
  expectedUpdatedAt: z.iso.datetime().optional(),
});
export const policyDecision = z.object({
  tenantId: id, expectedUpdatedAt: z.iso.datetime(), note: z.string().trim().max(2000).default(''),
});
export const policyApproval = policyDecision.extend({
  checks: z.object({
    context: z.literal(true, { error: 'Confirme la coherencia con el contexto y la dirección estratégica.' }),
    framework: z.literal(true, { error: 'Confirme el marco para los objetivos de calidad.' }),
    requirements: z.literal(true, { error: 'Confirme el compromiso con los requisitos aplicables.' }),
    improvement: z.literal(true, { error: 'Confirme el compromiso de mejora continua.' }),
  }),
});
const pastDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indique una fecha válida.')
  .refine(value => {
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value) && date.getTime() <= Date.now();
  }, 'La evidencia debe tener una fecha real que no esté en el futuro.');
export const policyCommunicationInput = z.object({
  tenantId: id, policyId: id, audience: text('Audiencia', 300), audienceType: z.enum(['INTERNA', 'EXTERNA']),
  method: text('Medio de comunicación', 200), date: pastDate, evidence: text('Referencia de evidencia', 2000),
  understandingEvidence: z.string().trim().max(2000).default(''), notes: z.string().trim().max(2000).default(''),
}).superRefine((value, ctx) => {
  if (value.audienceType === 'INTERNA' && !value.understandingEvidence) {
    ctx.addIssue({ code: 'custom', path: ['understandingEvidence'], message: 'Registre cómo se verificó la comprensión y aplicación de la política.' });
  }
});

export function policyRevisionIsNewer(version: string, previous: string) {
  const next = version.split('.').map(Number);
  const prior = previous.split('.').map(Number);
  return next[0] > prior[0] || (next[0] === prior[0] && (next[1] || 0) > (prior[1] || 0));
}
