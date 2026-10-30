import { Prisma } from '@prisma/client';
import { ApiError } from '@/lib/api-auth';
import { parseDocumentStandardConfig } from '@/lib/document-standard';
import { formDefinition, type AuditData, type AuditKind, type AuditSource, type AuditDocumentView } from './forms';
import { auditSections, type AuditExportSnapshot } from './export';

type Db = Prisma.TransactionClient;
export const jsonValue = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export const asView = <T>(value: unknown): T => JSON.parse(JSON.stringify(value)) as T;
export async function auditDirectory(db: Db, tenantId: string) {
  const [people, processes] = await Promise.all([
    db.user.findMany({ where: { tenantId }, select: { id: true, name: true, active: true, role: true }, orderBy: { name: 'asc' } }),
    db.process.findMany({ where: { tenantId }, select: { id: true, name: true, code: true, active: true }, orderBy: { name: 'asc' } }),
  ]);
  return { people, processes };
}
export async function loadAuditSource(db: Db, tenantId: string, ownerId: string, ownerType: 'program' | 'audit'): Promise<AuditSource> {
  const audit = ownerType === 'audit' ? await db.audit.findFirst({ where: { id: ownerId, tenantId } }) : null;
  if (ownerType === 'audit' && !audit) throw new ApiError(404, 'Auditoría no encontrada.');
  const programId = ownerType === 'program' ? ownerId : audit?.programId;
  const program = programId ? await db.auditProgram.findFirst({ where: { id: programId, tenantId } }) : null;
  if (ownerType === 'program' && !program) throw new ApiError(404, 'Programa no encontrado.');
  const [documents, audits, directory] = await Promise.all([
    db.auditDocument.findMany({ where: { tenantId, ...(ownerType === 'program' ? { programId: ownerId } : { auditId: ownerId }) }, orderBy: { kind: 'asc' } }),
    program ? db.audit.findMany({ where: { tenantId, programId: program.id }, orderBy: { scheduledDate: 'asc' } }) : Promise.resolve([]),
    auditDirectory(db, tenantId),
  ]);
  const normalized = (item: typeof audit) => item ? { ...item, processes: Array.isArray(item.processes) ? item.processes.filter(id => typeof id === 'string') : [], teamMemberIds: Array.isArray(item.teamMemberIds) ? item.teamMemberIds : [] } : null;
  return asView<AuditSource>({ program, audit: normalized(audit), audits: audits.map(normalized), documents, ...directory });
}
export function canWriteAudit(role: string, actorId: string, kind: AuditKind, source: AuditSource) {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN_EMPRESA' || role === 'USUARIO') return true;
  return kind !== 'F1' && kind !== 'F8' && Boolean(source.audit && (source.audit.leadAuditor === actorId || source.audit.teamMemberIds.includes(actorId)));
}
export function validateAuditReferences(kind: AuditKind, data: AuditData, previous: AuditData, source: AuditSource) {
  const definition = formDefinition(kind);
  const validate = (values: Record<string, string>, old: Record<string, string>, fields: typeof definition.fields) => {
    for (const field of fields) {
      const value = values[field.key];
      if (!value) continue;
      if (field.type === 'person' || field.type === 'process') {
        const entries = field.type === 'person' ? source.people : source.processes;
        const entry = entries.find(item => item.id === value);
        if (!entry || (!entry.active && old[field.key] !== value)) throw new ApiError(400, `${field.label}: seleccione un registro activo de esta empresa.`);
      }
      if (field.type === 'question' || field.type === 'finding') {
        const related = source.documents.find(doc => doc.kind === (field.type === 'question' ? 'F3' : 'F4'));
        if (!related?.data.rows.some(row => row.id === value)) throw new ApiError(400, `${field.label}: la referencia no pertenece a esta auditoría o todavía no se ha guardado.`);
      }
    }
  };
  validate(data.values, previous.values, definition.fields);
  data.rows.forEach(row => validate(row, previous.rows.find(old => old.id === row.id) || {}, definition.rowFields));
  if (kind === 'F3' || kind === 'F4') {
    const dependency = source.documents.find(doc => doc.kind === (kind === 'F3' ? 'F4' : 'F8'));
    const key = kind === 'F3' ? 'questionId' : 'findingId';
    if (dependency?.data.rows.some(row => row[key] && !data.rows.some(candidate => candidate.id === row[key]))) throw new ApiError(409, 'No puede eliminar un registro vinculado a un hallazgo o actividad de mejoramiento.');
  }
}
export async function captureAuditExport(db: Db, document: AuditDocumentView, source: AuditSource, tenantId: string): Promise<AuditExportSnapshot> {
  const [tenant, standard, formats] = await Promise.all([
    db.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { id: true, name: true, logo: true } }),
    db.documentStandard.findUnique({ where: { tenantId } }),
    db.formatControl.findMany({ where: { tenantId }, select: { moduleKey: true, code: true, version: true, approvalDate: true } }),
  ]);
  return { context: { tenant, config: parseDocumentStandardConfig(standard?.config), revision: standard?.revision || 0, formats }, sections: auditSections(document.kind, document.data, source) };
}
