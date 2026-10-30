import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { auditKinds, blankAuditData, parseAuditData, protectVerification, type AuditKind, type AuditDocumentView, type AuditData } from '@/lib/audits/forms';
import { asView, auditDirectory, canWriteAudit, captureAuditExport, jsonValue, loadAuditSource, validateAuditReferences } from '@/lib/audits/server';

export const dynamic = 'force-dynamic';
const idSchema = z.string().trim().min(1).max(100);
const dateSchema = z.iso.date('Ingrese una fecha válida.');
const programSchema = z.object({ name: z.string().trim().min(3).max(250), startDate: dateSchema, endDate: dateSchema }).refine(data => data.endDate >= data.startDate, 'La fecha final debe ser posterior o igual a la inicial.');
const auditSchema = z.object({ name: z.string().trim().min(3).max(250), programId: idSchema, type: z.enum(['INTERNA', 'EXTERNA']), scheduledDate: dateSchema, leadAuditor: idSchema, teamMemberIds: z.array(idSchema).max(50), processes: z.array(idSchema).min(1, 'Seleccione al menos un proceso.').max(100) });
const metaSelect = { id: true, kind: true, status: true, version: true, revision: true, auditId: true, programId: true, updatedAt: true };
const day = (value: string) => new Date(`${value}T12:00:00Z`);
const initialDoc = (kind: AuditKind, actor: { id: string; name: string }) => ({ kind, data: jsonValue(blankAuditData(kind)), updatedBy: actor.id, updatedByName: actor.name });
const revisionSchema = z.number().int().positive();
async function recordGeneralChange(tx: Prisma.TransactionClient, documentId: string, actor: { id: string; name: string }, note: string) {
  const before = await tx.auditDocument.findUniqueOrThrow({ where: { id: documentId } });
  const document = await tx.auditDocument.update({ where: { id: documentId }, data: { revision: { increment: 1 }, updatedBy: actor.id, updatedByName: actor.name } });
  const source = await loadAuditSource(tx, document.tenantId, document.programId || document.auditId!, document.programId ? 'program' : 'audit');
  await tx.auditDocumentEvent.create({ data: { documentId, action: 'save', version: document.version, userId: actor.id, userName: actor.name, note, snapshot: jsonValue({ before, document, source }) } });
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const tenantId = query.get('tenantId') || '';
    const actor = await requireTenantAccess(request, tenantId);
    const documentId = query.get('documentId');
    if (documentId) {
      const document = await prisma.auditDocument.findFirst({ where: { id: documentId, tenantId }, select: { id: true } });
      if (!document) throw new ApiError(404, 'Formato no encontrado.');
      const eventId = query.get('eventId');
      if (eventId) {
        const event = await prisma.auditDocumentEvent.findFirst({ where: { id: eventId, documentId } });
        if (!event) throw new ApiError(404, 'Versión no encontrada.');
        return NextResponse.json(event);
      }
      return NextResponse.json(await prisma.auditDocumentEvent.findMany({ where: { documentId }, select: { id: true, action: true, version: true, userName: true, note: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 100 }));
    }
    const ownerId = query.get('ownerId');
    if (ownerId) {
      const ownerType = z.enum(['program', 'audit']).parse(query.get('ownerType'));
      const source = await loadAuditSource(prisma, tenantId, ownerId, ownerType);
      return NextResponse.json({ ...source, editableKinds: auditKinds.filter(kind => canWriteAudit(actor.role, actor.id, kind, source)), canApprove: ['ADMIN_EMPRESA', 'SUPER_ADMIN'].includes(actor.role) });
    }
    if (query.get('followUp') === 'true') {
      const documents = await prisma.auditDocument.findMany({ where: { tenantId, kind: { in: ['F4', 'F8'] } }, include: { audit: { select: { id: true, name: true, code: true } } }, orderBy: { updatedAt: 'desc' } });
      return NextResponse.json({ documents, ...await auditDirectory(prisma, tenantId) });
    }
    const [programs, audits, directory] = await Promise.all([
      prisma.auditProgram.findMany({ where: { tenantId }, include: { documents: { select: metaSelect } }, orderBy: { startDate: 'desc' } }),
      prisma.audit.findMany({ where: { tenantId }, include: { auditDocuments: { select: metaSelect } }, orderBy: { scheduledDate: 'desc' } }),
      auditDirectory(prisma, tenantId),
    ]);
    return NextResponse.json({ programs, audits, ...directory, canManage: ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'USUARIO'].includes(actor.role) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 2_000_000) throw new ApiError(413, 'El formato excede el tamaño permitido. Divida el contenido en registros más pequeños.');
    const body = JSON.parse(text);
    const tenantId = idSchema.parse(body?.tenantId);
    const actor = await requireTenantAccess(request, tenantId);
    const admin = ['SUPER_ADMIN', 'ADMIN_EMPRESA'].includes(actor.role);
    const manager = admin || actor.role === 'USUARIO';
    const action = z.enum(['create_program', 'update_program', 'create_audit', 'update_audit', 'initialize_audit', 'save', 'submit', 'approve', 'return', 'revise']).parse(body.action);
    const result = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${tenantId}, 61030001))`;
      if (['create_program', 'update_program'].includes(action)) {
        if (!manager) throw new ApiError(403, 'No tiene permiso para gestionar programas.');
        const fields = programSchema.parse(body);
        const data = { name: fields.name, startDate: day(fields.startDate), endDate: day(fields.endDate) };
        if (action === 'create_program') {
          return tx.auditProgram.create({ data: { ...data, tenantId, code: `PA-${fields.startDate.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`, documents: { create: initialDoc('F1', actor) } } });
        }
        const id = idSchema.parse(body.id), revision = revisionSchema.parse(body.revision);
        const doc = await tx.auditDocument.findFirst({ where: { tenantId, programId: id, kind: 'F1' } });
        if (doc?.status !== 'BORRADOR') throw new ApiError(409, 'Abra una nueva revisión del programa antes de modificar sus datos generales.');
        const outside = await tx.audit.count({ where: { tenantId, programId: id, OR: [{ scheduledDate: { lt: data.startDate } }, { scheduledDate: { gt: data.endDate } }] } });
        if (outside) throw new ApiError(400, 'El periodo debe incluir las auditorías vinculadas.');
        const changed = await tx.auditProgram.updateMany({ where: { id, tenantId, revision }, data: { ...data, revision: { increment: 1 } } });
        if (!changed.count) throw new ApiError(409, 'El programa cambió. Recargue antes de guardar.');
        await recordGeneralChange(tx, doc.id, actor, 'Actualización de los datos generales del programa.');
        return tx.auditProgram.findUniqueOrThrow({ where: { id } });
      }
      if (['create_audit', 'update_audit', 'initialize_audit'].includes(action)) {
        if (!manager) throw new ApiError(403, 'No tiene permiso para gestionar auditorías.');
        if (action === 'initialize_audit') {
          const audit = await tx.audit.findFirst({ where: { id: idSchema.parse(body.id), tenantId } });
          if (!audit) throw new ApiError(404, 'Auditoría no encontrada.');
          for (const kind of auditKinds.filter(kind => kind !== 'F1')) await tx.auditDocument.upsert({ where: { auditId_kind: { auditId: audit.id, kind } }, update: {}, create: { ...initialDoc(kind, actor), tenantId, auditId: audit.id } });
          return audit;
        }
        const fields = auditSchema.parse(body);
        const program = await tx.auditProgram.findFirst({ where: { id: fields.programId, tenantId } });
        if (!program) throw new ApiError(400, 'Seleccione un programa de esta empresa.');
        const programDocument = await tx.auditDocument.findFirst({ where: { tenantId, programId: program.id, kind: 'F1' } });
        if (programDocument?.status !== 'BORRADOR') throw new ApiError(409, 'Abra una nueva versión de F1 antes de cambiar el cronograma del programa.');
        const scheduledDate = day(fields.scheduledDate);
        if (scheduledDate < program.startDate || scheduledDate > program.endDate) throw new ApiError(400, 'La fecha de auditoría debe estar dentro del periodo del programa.');
        const peopleIds = [...new Set([fields.leadAuditor, ...fields.teamMemberIds])];
        const people = await tx.user.findMany({ where: { tenantId, id: { in: peopleIds }, active: true }, select: { id: true, name: true } });
        if (people.length !== peopleIds.length) throw new ApiError(400, 'Los auditores deben ser usuarios activos de esta empresa.');
        if (new Set(fields.processes).size !== fields.processes.length || await tx.process.count({ where: { tenantId, id: { in: fields.processes }, active: true } }) !== fields.processes.length) throw new ApiError(400, 'Seleccione procesos activos de esta empresa sin duplicados.');
        const data = { ...fields, scheduledDate, leadAuditorName: people.find(person => person.id === fields.leadAuditor)!.name, teamMemberIds: peopleIds };
        if (action === 'create_audit') {
          const audit = await tx.audit.create({ data: { ...data, tenantId, code: `AUD-${fields.scheduledDate.slice(0, 4)}-${randomUUID().slice(0, 8).toUpperCase()}`, auditDocuments: { create: auditKinds.filter(kind => kind !== 'F1').map(kind => initialDoc(kind, actor)) } } });
          await recordGeneralChange(tx, programDocument.id, actor, `Auditoría ${audit.code} agregada al cronograma.`);
          return audit;
        }
        const id = idSchema.parse(body.id), revision = revisionSchema.parse(body.revision);
        const doc = await tx.auditDocument.findFirst({ where: { tenantId, auditId: id, kind: 'F2' } });
        if (doc?.status !== 'BORRADOR') throw new ApiError(409, 'Abra una nueva revisión del plan antes de modificar la auditoría.');
        const oldAudit = await tx.audit.findFirst({ where: { id, tenantId } });
        const previousProgramDocument = oldAudit?.programId && oldAudit.programId !== program.id ? await tx.auditDocument.findFirst({ where: { tenantId, programId: oldAudit.programId, kind: 'F1' } }) : null;
        if (previousProgramDocument && previousProgramDocument.status !== 'BORRADOR') throw new ApiError(409, 'Abra una nueva versión del programa de origen antes de trasladar esta auditoría.');
        const changed = await tx.audit.updateMany({ where: { id, tenantId, revision }, data: { ...data, revision: { increment: 1 } } });
        if (!changed.count) throw new ApiError(409, 'La auditoría cambió. Recargue antes de guardar.');
        await recordGeneralChange(tx, doc.id, actor, 'Actualización de los datos generales de la auditoría.');
        await recordGeneralChange(tx, programDocument.id, actor, 'Actualización del cronograma de auditorías.');
        if (previousProgramDocument) await recordGeneralChange(tx, previousProgramDocument.id, actor, 'Traslado de auditoría a otro programa.');
        return tx.audit.findUniqueOrThrow({ where: { id } });
      }
      const documentId = idSchema.parse(body.documentId), revision = revisionSchema.parse(body.revision);
      const stored = await tx.auditDocument.findFirst({ where: { id: documentId, tenantId } });
      if (!stored) throw new ApiError(404, 'Formato no encontrado.');
      if (stored.revision !== revision) throw new ApiError(409, 'Otra persona modificó el formato. Recargue para ver la última versión.');
      const kind = z.enum(auditKinds).parse(stored.kind);
      const source = await loadAuditSource(tx, tenantId, stored.programId || stored.auditId!, stored.programId ? 'program' : 'audit');
      if (!canWriteAudit(actor.role, actor.id, kind, source)) throw new ApiError(403, 'Solo el equipo auditor asignado puede diligenciar este formato; la gestión de programas y acciones corresponde a la empresa.');
      if (['approve', 'return'].includes(action) && !admin) throw new ApiError(403, 'La revisión corresponde a un administrador.');
      const previous = asView<AuditData>(stored.data);
      let data = previous;
      let status = stored.status, version = stored.version;
      let approvedAt = stored.approvedAt, approvedBy = stored.approvedBy, approvedByName = stored.approvedByName;
      let exportSnapshot: Prisma.InputJsonValue | typeof Prisma.DbNull = stored.exportSnapshot ? jsonValue(stored.exportSnapshot) : Prisma.DbNull;
      const note = z.string().trim().max(5000).parse(body.note || '');
      if (action === 'save') {
        if (status !== 'BORRADOR') throw new ApiError(409, 'Solo se pueden editar borradores.');
        try {
          data = parseAuditData(kind, body.data);
          if (kind === 'F8') data = protectVerification(data, previous, admin, actor.name, new Date().toISOString());
        } catch (error) { throw new ApiError(400, (error as Error).message); }
        validateAuditReferences(kind, data, previous, source);
      } else if (action === 'submit') {
        if (status !== 'BORRADOR') throw new ApiError(409, 'Solo un borrador puede enviarse a revisión.');
        try { parseAuditData(kind, previous, true); } catch (error) { throw new ApiError(400, (error as Error).message); }
        validateAuditReferences(kind, previous, previous, source);
        if (kind === 'F1' && !source.audits.length) throw new ApiError(400, 'Agregue al menos una auditoría al programa.');
        status = 'EN_REVISION';
      } else if (action === 'approve') {
        if (status !== 'EN_REVISION') throw new ApiError(409, 'El formato debe estar en revisión.');
        try { parseAuditData(kind, previous, true); } catch (error) { throw new ApiError(400, (error as Error).message); }
        validateAuditReferences(kind, previous, previous, source);
        if (kind === 'F7' && ['F2', 'F4'].some(key => source.documents.find(doc => doc.kind === key)?.status !== 'APROBADO')) throw new ApiError(409, 'Apruebe el plan F2 y el registro de hallazgos F4 antes de emitir el informe.');
        status = 'APROBADO'; approvedAt = new Date(); approvedBy = actor.id; approvedByName = actor.name;
        exportSnapshot = jsonValue(await captureAuditExport(tx, asView<AuditDocumentView>(stored), source, tenantId));
        if (stored.auditId && ['F5', 'F7'].includes(kind)) await tx.audit.update({ where: { id: stored.auditId }, data: { ...(kind === 'F7' ? { status: 'COMPLETADA', completionDate: approvedAt } : source.audit?.status === 'PROGRAMADA' ? { status: 'EN_PROGRESO' } : {}), revision: { increment: 1 } } });
      } else if (action === 'return') {
        if (status !== 'EN_REVISION' || !note) throw new ApiError(400, 'Un formato en revisión requiere un motivo para devolverlo.');
        status = 'BORRADOR';
      } else if (action === 'revise') {
        if (status !== 'APROBADO' || !note) throw new ApiError(400, 'Indique el motivo de la nueva revisión de un formato aprobado.');
        status = 'BORRADOR'; version += 1; approvedAt = null; approvedBy = null; approvedByName = null; exportSnapshot = Prisma.DbNull;
        if (kind === 'F7' && stored.auditId) await tx.audit.update({ where: { id: stored.auditId }, data: { status: 'EN_PROGRESO', completionDate: null, revision: { increment: 1 } } });
      }
      // Every mutation has a recoverable previous and resulting snapshot in the event log.
      const updated = await tx.auditDocument.update({ where: { id: documentId, revision }, data: { data: jsonValue(data), status, version, approvedAt, approvedBy, approvedByName, exportSnapshot, revision: { increment: 1 }, updatedBy: actor.id, updatedByName: actor.name } });
      await tx.auditDocumentEvent.create({ data: { documentId, action, version: updated.version, userId: actor.id, userName: actor.name, note, snapshot: jsonValue({ before: stored, document: updated, source: { ...source, documents: source.documents.map(doc => doc.id === updated.id ? asView<AuditDocumentView>(updated) : doc) } }) } });
      return updated;
    }, { maxWait: 10000, timeout: 20000 });
    return NextResponse.json(result, { status: action.startsWith('create_') ? 201 : 200 });
  } catch (error) { return apiError(error); }
}
