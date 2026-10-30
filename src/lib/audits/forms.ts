import { z } from 'zod';

export const auditKinds = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'] as const;
export type AuditKind = typeof auditKinds[number];
export type AuditData = { values: Record<string, string>; rows: AuditRow[] };
export type AuditRow = Record<string, string> & { id: string };
export type Field = { key: string; label: string; type?: 'text' | 'textarea' | 'date' | 'time' | 'person' | 'process' | 'finding' | 'question' | 'select'; required?: boolean; options?: string[] };
export type AuditDefinition = { kind: AuditKind; title: string; description: string; fields: Field[]; rowTitle: string; rowFields: Field[]; orientation: 'portrait' | 'landscape' };
const field = (key: string, label: string, type: Field['type'] = 'textarea', required = false, options?: string[]): Field => ({ key, label, type, required, options });
const attendees = [field('name', 'Nombre del participante', 'text', true), field('role', 'Cargo / papel en la auditoría', 'text', true), field('organization', 'Empresa / área', 'text'), field('attendance', 'Constancia de asistencia', 'select', true, ['Asistió', 'No asistió']), field('confirmation', 'Referencia de confirmación o firma', 'text')];
export const AUDIT_FORMS: AuditDefinition[] = [
  { kind: 'F1', title: 'Programa de auditorías', description: 'Planifique el periodo y consulte el cronograma de las auditorías vinculadas.', orientation: 'landscape',
    fields: [field('objectives', 'Objetivos del programa', 'textarea', true), field('scope', 'Alcance general, sedes y sistemas', 'textarea', true), field('priorities', 'Prioridades: riesgos, cambios y auditorías anteriores', 'textarea', true), field('frequency', 'Frecuencia y criterios de programación', 'textarea', true), field('methods', 'Métodos de auditoría', 'textarea', true), field('resources', 'Recursos requeridos'), field('managerId', 'Responsable del programa', 'person', true), field('reporting', 'Comunicación de resultados y seguimiento', 'textarea', true)], rowTitle: '', rowFields: [] },
  { kind: 'F2', title: 'Plan de auditoría', description: 'Defina objetivos, alcance, criterios y agenda del expediente seleccionado.', orientation: 'landscape',
    fields: [field('objectives', 'Objetivos de la auditoría', 'textarea', true), field('scope', 'Alcance de la auditoría', 'textarea', true), field('criteria', 'Criterios, normas y documentos de referencia', 'textarea', true), field('method', 'Modalidad', 'select', true, ['Presencial', 'Remota', 'Mixta']), field('location', 'Lugar / enlace de reunión', 'text', true), field('independence', 'Competencia e imparcialidad del equipo auditor', 'textarea', true), field('logistics', 'Recursos, logística y confidencialidad')], rowTitle: 'Actividades de la agenda',
    rowFields: [field('date', 'Fecha', 'date', true), field('startTime', 'Hora de inicio', 'time', true), field('endTime', 'Hora de fin', 'time', true), field('processId', 'Proceso', 'process', true), field('activity', 'Actividad y requisitos por revisar', 'textarea', true), field('auditorId', 'Auditor responsable', 'person', true), field('auditee', 'Persona auditada / cargo', 'text', true)] },
  { kind: 'F3', title: 'Lista de verificación', description: 'Registre preguntas, respuestas y evidencias por proceso y criterio.', orientation: 'landscape',
    fields: [field('instructions', 'Instrucciones y método de muestreo'), field('notes', 'Observaciones generales')], rowTitle: 'Preguntas de auditoría',
    rowFields: [field('processId', 'Proceso', 'process', true), field('criterion', 'Requisito / criterio', 'text', true), field('question', 'Pregunta', 'textarea', true), field('expectedEvidence', 'Evidencia esperada'), field('answer', 'Respuesta obtenida'), field('evidence', 'Evidencia revisada / referencia verificable'), field('result', 'Resultado', 'select', true, ['Pendiente', 'Cumple', 'No cumple', 'No aplica']), field('notes', 'Observaciones / justificación de no aplicación')] },
  { kind: 'F4', title: 'Registro de hallazgos', description: 'Relacione cada hallazgo con su criterio, evidencia y pregunta de origen.', orientation: 'portrait',
    fields: [field('summary', 'Resumen de resultados', 'textarea', true)], rowTitle: 'Hallazgos',
    rowFields: [field('questionId', 'Pregunta de origen (opcional)', 'question'), field('processId', 'Proceso', 'process', true), field('criterion', 'Requisito / criterio evaluado', 'text', true), field('classification', 'Clasificación', 'select', true, ['No conformidad mayor', 'No conformidad menor', 'Observación', 'Oportunidad de mejora', 'Fortaleza']), field('description', 'Descripción del hallazgo', 'textarea', true), field('evidence', 'Evidencia objetiva / referencia verificable', 'textarea', true), field('auditorId', 'Auditor que registra', 'person', true), field('date', 'Fecha', 'date', true)] },
  { kind: 'F5', title: 'Acta de apertura de auditoría', description: 'Documente la reunión inicial y la confirmación del plan de auditoría.', orientation: 'portrait',
    fields: [field('date', 'Fecha de apertura', 'date', true), field('time', 'Hora', 'time', true), field('location', 'Lugar / modalidad', 'text', true), field('confirmedScope', 'Objetivos y alcance confirmados', 'textarea', true), field('methodology', 'Metodología y agenda acordadas', 'textarea', true), field('communication', 'Comunicación, confidencialidad y recursos'), field('agreements', 'Compromisos y ajustes acordados', 'textarea', true)], rowTitle: 'Participantes', rowFields: attendees },
  { kind: 'F6', title: 'Acta de cierre de auditoría', description: 'Registre la presentación de resultados, acuerdos y compromisos de cierre.', orientation: 'portrait',
    fields: [field('date', 'Fecha de cierre', 'date', true), field('time', 'Hora', 'time', true), field('location', 'Lugar / modalidad', 'text', true), field('conclusions', 'Conclusiones presentadas', 'textarea', true), field('disagreements', 'Desacuerdos y asuntos pendientes'), field('commitments', 'Compromisos, responsables y plazos', 'textarea', true), field('reportDueDate', 'Fecha prevista del informe', 'date', true), field('responseDueDate', 'Plazo de respuesta a los hallazgos', 'date', true)], rowTitle: 'Participantes', rowFields: attendees },
  { kind: 'F7', title: 'Informe de auditoría', description: 'Consolide el plan, los hallazgos y las conclusiones para su emisión.', orientation: 'portrait',
    fields: [field('reportDate', 'Fecha del informe', 'date', true), field('executiveSummary', 'Resumen ejecutivo', 'textarea', true), field('methodology', 'Metodología y muestreo aplicados', 'textarea', true), field('coverage', 'Procesos evaluados y cobertura real', 'textarea', true), field('conclusions', 'Conclusiones sobre conformidad y eficacia', 'textarea', true), field('limitations', 'Limitaciones y aspectos no evaluados'), field('distribution', 'Destinatarios y comunicación del informe', 'textarea', true), field('annexes', 'Referencias de anexos y evidencias')], rowTitle: '', rowFields: [] },
  { kind: 'F8', title: 'Plan de mejoramiento', description: 'Conecte hallazgos, causas, actividades y verificación de eficacia.', orientation: 'portrait',
    fields: [field('objectives', 'Objetivo del plan de mejoramiento', 'textarea', true), field('monitoring', 'Método y frecuencia de seguimiento', 'textarea', true)], rowTitle: 'Actividades de mejoramiento',
    rowFields: [field('findingId', 'Hallazgo de origen', 'finding', true), field('cause', 'Análisis de causas', 'textarea', true), field('correction', 'Corrección inmediata (cuando aplique)'), field('action', 'Actividad / acción correctiva', 'textarea', true), field('responsibleId', 'Responsable', 'person', true), field('resources', 'Recursos'), field('dueDate', 'Fecha límite', 'date', true), field('status', 'Estado de la actividad', 'select', true, ['Pendiente', 'En curso', 'Implementada', 'Cerrada']), field('evidence', 'Evidencia de implementación'), field('effectiveness', 'Resultado de la verificación de eficacia', 'select', false, ['Pendiente', 'Eficaz', 'No eficaz']), field('evaluation', 'Evaluación y evidencia de eficacia')] },
];
export const formDefinition = (kind: AuditKind) => AUDIT_FORMS.find(form => form.kind === kind)!;
export const auditStatusLabels: Record<string, string> = { BORRADOR: 'Borrador', EN_REVISION: 'En revisión', APROBADO: 'Aprobado' };
export function blankAuditData(kind: AuditKind): AuditData {
  return { values: Object.fromEntries(formDefinition(kind).fields.map(f => [f.key, ''])), rows: [] };
}
export function blankAuditRow(kind: AuditKind, id: string): AuditRow {
  return { id, ...Object.fromEntries(formDefinition(kind).rowFields.map(f => [f.key, ['result', 'status', 'effectiveness'].includes(f.key) ? f.options?.[0] || '' : ''])) };
}
function valueSchema(f: Field) {
  let schema = z.string().trim().max(f.type === 'textarea' ? 16000 : 1000, `${f.label}: el contenido es demasiado extenso.`);
  if (f.type === 'date') schema = schema.refine(value => !value || z.iso.date().safeParse(value).success, `${f.label}: fecha no válida.`);
  if (f.type === 'time') schema = schema.refine(value => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), `${f.label}: hora no válida.`);
  if (f.options) schema = schema.refine(value => !value || f.options!.includes(value), `${f.label}: opción no válida.`);
  return schema.default('');
}
export function parseAuditData(kind: AuditKind, input: unknown, complete = false): AuditData {
  const definition = formDefinition(kind);
  const shape = (fields: Field[]) => Object.fromEntries(fields.map(f => [f.key, valueSchema(f)]));
  const result = z.object({
    values: z.object(shape(definition.fields)),
    rows: z.array(z.object({ id: z.string().min(1).max(100), ...shape(definition.rowFields), verifiedBy: z.string().max(250).optional(), verifiedAt: z.string().max(100).optional() })).max(300, 'Máximo 300 registros por formato.'),
  }).parse(input) as AuditData;
  if (!definition.rowFields.length && result.rows.length) throw new Error('Este formato no admite filas adicionales.');
  if (new Set(result.rows.map(row => row.id)).size !== result.rows.length) throw new Error('Hay identificadores de fila repetidos.');
  if (complete) {
    for (const f of definition.fields) if (f.required && !result.values[f.key]) throw new Error(`Complete ${f.label}.`);
    if (definition.rowFields.length && kind !== 'F4' && !result.rows.length) throw new Error(`Agregue al menos un registro en ${definition.rowTitle}.`);
    result.rows.forEach((row, index) => {
      for (const f of definition.rowFields) if (f.required && !row[f.key]) throw new Error(`Registro ${index + 1}: complete ${f.label}.`);
      if (kind === 'F3') {
        if (!row.result || row.result === 'Pendiente') throw new Error(`Pregunta ${index + 1}: registre el resultado.`);
        if (row.result === 'No aplica' ? !row.notes : !row.evidence) throw new Error(`Pregunta ${index + 1}: registre evidencia o justifique la no aplicación.`);
      }
    });
  }
  for (const row of result.rows) {
    if (kind === 'F2' && row.startTime && row.endTime && row.endTime <= row.startTime) throw new Error('La hora final de cada actividad debe ser posterior a la inicial.');
    if (kind === 'F8' && ['Implementada', 'Cerrada'].includes(row.status) && !row.evidence) throw new Error('Una actividad implementada necesita evidencia.');
    if (kind === 'F8' && row.status === 'Cerrada' && (row.effectiveness !== 'Eficaz' || !row.evaluation)) throw new Error('El cierre requiere eficacia verificada y evidencia de evaluación.');
    if (kind === 'F8' && row.effectiveness && row.effectiveness !== 'Pendiente' && !row.evaluation) throw new Error('Documente la evaluación de eficacia.');
  }
  if (kind === 'F6') for (const key of ['reportDueDate', 'responseDueDate']) if (result.values[key] && result.values.date && result.values[key] < result.values.date) throw new Error('Los plazos no pueden ser anteriores a la reunión de cierre.');
  return result;
}

export function protectVerification(data: AuditData, previous: AuditData, isAdmin: boolean, actorName: string, now: string): AuditData {
  const rows = data.rows.map(row => {
    const old = previous.rows.find(item => item.id === row.id);
    const content = (item: AuditRow) => Object.fromEntries(Object.entries(item).filter(([key]) => !['verifiedBy', 'verifiedAt'].includes(key)).sort(([a], [b]) => a.localeCompare(b)));
    const unchanged = old && JSON.stringify(content(old)) === JSON.stringify(content(row));
    const verified = row.effectiveness === 'Eficaz' || row.effectiveness === 'No eficaz';
    if (!isAdmin && ((verified && !unchanged) || (old?.verifiedAt && !unchanged))) throw new Error('Solo un administrador puede verificar la eficacia o modificar una actividad verificada.');
    if (unchanged) return { ...row, verifiedBy: old.verifiedBy || '', verifiedAt: old.verifiedAt || '' };
    return { ...row, verifiedBy: verified ? actorName : '', verifiedAt: verified ? now : '' };
  });
  for (const old of previous.rows) if (old.verifiedAt && !rows.some(row => row.id === old.id)) throw new Error('Una actividad verificada conserva su trazabilidad y no puede eliminarse.');
  return { ...data, rows };
}

export type DirectoryPerson = { id: string; name: string; active: boolean; role: string };
export type DirectoryProcess = { id: string; name: string; code: string; active: boolean };
export type AuditProgramView = { id: string; code: string; name: string; startDate: string; endDate: string; revision: number };
export type AuditView = { id: string; name: string; code: string | null; programId: string | null; type: string; status: string; leadAuditor: string; leadAuditorName: string | null; teamMemberIds: string[]; processes: string[]; scheduledDate: string; revision: number };
export type AuditDocumentView = {
  id: string; kind: AuditKind; status: string; version: number; revision: number; data: AuditData;
  approvedAt: string | null; approvedByName: string | null; updatedByName: string; updatedAt: string;
  exportSnapshot?: unknown; auditId: string | null; programId: string | null;
};
export type AuditSource = { program: AuditProgramView | null; audit: AuditView | null; audits: AuditView[]; people: DirectoryPerson[]; processes: DirectoryProcess[]; documents: AuditDocumentView[] };
export function referenceLabel(field: Field, value: string, source: AuditSource): string {
  if (!value) return '—';
  if (field.type === 'person') return source.people.find(item => item.id === value)?.name || value;
  if (field.type === 'process') { const item = source.processes.find(item => item.id === value); return item ? `${item.code} · ${item.name}` : value; }
  if (field.type === 'finding' || field.type === 'question') {
    const doc = source.documents.find(item => item.kind === (field.type === 'finding' ? 'F4' : 'F3'));
    const index = doc?.data.rows.findIndex(row => row.id === value) ?? -1;
    const row = doc?.data.rows[index];
    return row ? `${field.type === 'finding' ? 'H' : 'P'}${index + 1} · ${row.description || row.question}` : value;
  }
  return value;
}
