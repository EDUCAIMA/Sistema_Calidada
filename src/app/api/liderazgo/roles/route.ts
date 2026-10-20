import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import {
  assignmentContentChanged,
  evaluateResponsibilityMatrix,
  leadershipMutationSchema,
  responsibilityAssignmentSchema,
  responsibilityCommunicationSchema,
  responsibilityMatrixActionSchema,
  responsibilityMatrixApprovalSchema,
  SGC_DUTIES,
} from '@/lib/leadership';

const snapshot = (value: unknown) => JSON.parse(JSON.stringify(value));

async function addEvent(
  tx: Prisma.TransactionClient,
  data: { tenantId: string; recordType: 'RESPONSIBILITY' | 'RESPONSIBILITY_MATRIX'; recordId: string; action: string; actor: { id: string; name: string }; value: unknown },
) {
  await tx.leadershipRecordEvent.create({ data: {
    tenantId: data.tenantId,
    recordType: data.recordType,
    recordId: data.recordId,
    action: data.action,
    userId: data.actor.id,
    userName: data.actor.name,
    snapshot: snapshot(data.value),
  } });
}

async function lockLiveMatrix(tx: Prisma.TransactionClient, matrixId: string, tenantId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "ResponsibilityMatrix"
    WHERE "id" = ${matrixId} AND "tenantId" = ${tenantId} AND "status" = 'VIGENTE'
    FOR SHARE
  `);
  return rows.length === 1;
}

function coverageMessage(
  coverage: ReturnType<typeof evaluateResponsibilityMatrix>,
  processes: { id: string; name: string }[],
) {
  const processNames = new Map(processes.map(process => [process.id, process.name]));
  const parts: string[] = [];
  if (!coverage.assignmentCount) parts.push('registre al menos una asignación activa');
  if (coverage.missingDuties.length) parts.push(`asigne: ${coverage.missingDuties.map(key => SGC_DUTIES[key as keyof typeof SGC_DUTIES]).join('; ')}`);
  if (coverage.missingResponsibleProcessIds.length) parts.push(`defina R (responsable) para: ${coverage.missingResponsibleProcessIds.map(id => processNames.get(id) || id).join(', ')}`);
  if (coverage.missingAccountableProcessIds.length) parts.push(`defina A (autoridad final) para: ${coverage.missingAccountableProcessIds.map(id => processNames.get(id) || id).join(', ')}`);
  if (coverage.inactiveAssigneeIds.length) parts.push('reemplace titulares inactivos');
  if (coverage.invalidProcessAssignmentIds.length) parts.push('corrija filas vinculadas a procesos inexistentes o inactivos');
  if (coverage.staleResponsibleAssignmentIds.length) parts.push('actualice las filas R que ya no corresponden al responsable vigente del proceso');
  if (coverage.incompleteAssignmentIds.length) parts.push('complete cargo, área, reporte, responsabilidades, autoridades y función RACI en todas las filas activas');
  return parts.join('. ');
}

async function matrixCoverage(tx: Prisma.TransactionClient, tenantId: string, matrixId: string, status: string) {
  const [records, processes, users] = await Promise.all([
    tx.responsibilityAssignment.findMany({ where: { tenantId, matrixId } }),
    tx.process.findMany({ where: { tenantId, active: true }, select: { id: true, name: true, responsibleId: true }, orderBy: { order: 'asc' } }),
    tx.user.findMany({ where: { tenantId, active: true }, select: { id: true } }),
  ]);
  return {
    records,
    processes,
    coverage: evaluateResponsibilityMatrix(records, processes, users.map(user => user.id), status),
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenantId');
    const requestedMatrixId = url.searchParams.get('matrixId');
    const actor = await requireTenantAccess(request, tenantId);
    const [matrices, users, processes, events] = await Promise.all([
      prisma.responsibilityMatrix.findMany({ where: { tenantId: tenantId! }, orderBy: { version: 'desc' } }),
      prisma.user.findMany({ where: { tenantId: tenantId!, active: true }, select: { id: true, name: true, position: true, topManagement: true }, orderBy: { name: 'asc' } }),
      prisma.process.findMany({ where: { tenantId: tenantId!, active: true }, select: { id: true, name: true, code: true, responsibleId: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
      prisma.leadershipRecordEvent.findMany({ where: { tenantId: tenantId!, recordType: { in: ['RESPONSIBILITY', 'RESPONSIBILITY_MATRIX'] } }, orderBy: { createdAt: 'desc' } }),
    ]);
    const canReview = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN_EMPRESA' || actor.topManagement;
    const openMatrix = matrices.find(item => item.status === 'BORRADOR' || item.status === 'EN_REVISION');
    const liveMatrix = matrices.find(item => item.status === 'VIGENTE');
    const matrix = requestedMatrixId
      ? matrices.find(item => item.id === requestedMatrixId)
      : canReview ? openMatrix || liveMatrix || matrices[0] : liveMatrix || openMatrix || matrices[0];
    if (requestedMatrixId && !matrix) throw new ApiError(404, 'Versión de la matriz no encontrada.');
    const records = matrix ? await prisma.responsibilityAssignment.findMany({
      where: { tenantId: tenantId!, matrixId: matrix.id }, orderBy: [{ active: 'desc' }, { processName: 'asc' }, { title: 'asc' }],
    }) : [];
    const coverage = evaluateResponsibilityMatrix(records, processes, users.map(user => user.id), matrix?.status || 'BORRADOR');
    return NextResponse.json({ matrices, matrix: matrix || null, records, users, processes, events, coverage });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = await requireTenantAccess(request, body?.tenantId, { admin: true, write: true });
    const parsed = responsibilityAssignmentSchema.parse(body);
    const record = await prisma.$transaction(async tx => {
      let matrix = parsed.matrixId
        ? await tx.responsibilityMatrix.findFirst({ where: { id: parsed.matrixId, tenantId: body.tenantId } })
        : await tx.responsibilityMatrix.findFirst({ where: { tenantId: body.tenantId, status: 'BORRADOR' }, orderBy: { version: 'desc' } });
      if (matrix && matrix.status !== 'BORRADOR') throw new ApiError(409, 'La versión seleccionada es inmutable. Cree una nueva revisión.');
      if (!matrix) {
        const previous = await tx.responsibilityMatrix.findFirst({ where: { tenantId: body.tenantId }, orderBy: { version: 'desc' } });
        if (previous) throw new ApiError(409, 'Cree una nueva revisión antes de agregar responsabilidades.');
        matrix = await tx.responsibilityMatrix.create({ data: {
          tenantId: body.tenantId, version: 1,
          createdById: actor.id, createdByName: actor.name, updatedById: actor.id, updatedByName: actor.name,
        } });
        await addEvent(tx, { tenantId: body.tenantId, recordType: 'RESPONSIBILITY_MATRIX', recordId: matrix.id, action: 'MATRIZ_CREADA', actor, value: matrix });
      }
      const [assignee, process] = await Promise.all([
        tx.user.findFirst({ where: { id: parsed.assignedToId, tenantId: body.tenantId, active: true }, select: { name: true, position: true } }),
        tx.process.findFirst({ where: { id: parsed.processId, tenantId: body.tenantId, active: true }, select: { id: true, name: true, responsibleId: true } }),
      ]);
      if (!assignee) throw new ApiError(400, 'Seleccione una persona activa de esta empresa.');
      if (!process) throw new ApiError(400, 'Seleccione un proceso activo de esta empresa.');
      if (parsed.raciRoles.includes('RESPONSABLE') && process.responsibleId !== parsed.assignedToId) {
        throw new ApiError(400, 'La función R debe corresponder al responsable vigente del proceso. Actualice primero el dueño del proceso si es necesario.');
      }
      const duplicate = await tx.responsibilityAssignment.findFirst({ where: {
        matrixId: matrix.id, active: true, processId: process.id, assignedToId: parsed.assignedToId, title: parsed.title,
      }, select: { id: true } });
      if (duplicate) throw new ApiError(409, 'Ya existe esta asignación activa para la persona, cargo y proceso.');
      const claimedMatrix = await tx.responsibilityMatrix.updateMany({
        where: { id: matrix.id, tenantId: body.tenantId, status: 'BORRADOR', updatedAt: matrix.updatedAt },
        data: { updatedById: actor.id, updatedByName: actor.name },
      });
      if (claimedMatrix.count !== 1) throw new ApiError(409, 'La matriz cambió o dejó de estar en borrador. Actualice la página.');
      const input = { ...parsed };
      delete input.matrixId;
      const created = await tx.responsibilityAssignment.create({ data: {
        ...input, tenantId: body.tenantId, matrixId: matrix.id, processName: process.name,
        assignedToName: assignee.name,
        createdById: actor.id, createdByName: actor.name, updatedById: actor.id, updatedByName: actor.name,
      } });
      await addEvent(tx, { tenantId: body.tenantId, recordType: 'RESPONSIBILITY', recordId: created.id, action: 'ASIGNADO', actor, value: created });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(record, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (body?.action === 'CREATE_REVISION') {
      const parsed = responsibilityMatrixActionSchema.parse(body);
      const actor = await requireTenantAccess(request, parsed.tenantId, { admin: true, write: true });
      const result = await prisma.$transaction(async tx => {
        const source = await tx.responsibilityMatrix.findFirst({ where: { id: parsed.matrixId, tenantId: parsed.tenantId, status: 'VIGENTE' } });
        if (!source) throw new ApiError(409, 'Solo una matriz vigente puede originar una revisión.');
        if (source.updatedAt.toISOString() !== parsed.expectedUpdatedAt) throw new ApiError(409, 'La matriz cambió. Actualice la página.');
        if (await tx.responsibilityMatrix.findFirst({ where: { tenantId: parsed.tenantId, status: { in: ['BORRADOR', 'EN_REVISION'] } }, select: { id: true } })) {
          throw new ApiError(409, 'Ya existe una revisión abierta.');
        }
        const latest = await tx.responsibilityMatrix.findFirst({ where: { tenantId: parsed.tenantId }, orderBy: { version: 'desc' }, select: { version: true } });
        const revision = await tx.responsibilityMatrix.create({ data: {
          tenantId: parsed.tenantId, code: source.code, version: (latest?.version || source.version) + 1, status: 'BORRADOR', scope: source.scope, supersedesId: source.id,
          createdById: actor.id, createdByName: actor.name, updatedById: actor.id, updatedByName: actor.name,
        } });
        const rows = await tx.responsibilityAssignment.findMany({ where: { matrixId: source.id, active: true } });
        for (const row of rows) {
          await tx.responsibilityAssignment.create({ data: {
            tenantId: row.tenantId,
            matrixId: revision.id,
            processId: row.processId,
            processName: row.processName,
            title: row.title,
            department: row.department,
            assignedToId: row.assignedToId,
            assignedToName: row.assignedToName,
            reportsTo: row.reportsTo,
            responsibilities: row.responsibilities,
            authorities: row.authorities,
            raciRoles: row.raciRoles as Prisma.InputJsonValue,
            sgcDuties: row.sgcDuties as Prisma.InputJsonValue,
            active: row.active,
            communicatedAt: null, communicationMethod: null, communicationAudience: null,
            communicationEvidence: null, acknowledgedAt: null, acknowledgedById: null, understandingEvidence: null,
            createdById: actor.id, createdByName: actor.name, updatedById: actor.id, updatedByName: actor.name,
          } });
        }
        await addEvent(tx, { tenantId: parsed.tenantId, recordType: 'RESPONSIBILITY_MATRIX', recordId: revision.id, action: 'REVISION_CREADA', actor, value: revision });
        return revision;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return NextResponse.json(result, { status: 201 });
    }

    if (body?.action === 'SUBMIT_MATRIX' || body?.action === 'RETURN_TO_DRAFT') {
      const parsed = responsibilityMatrixActionSchema.parse(body);
      const returning = parsed.action === 'RETURN_TO_DRAFT';
      const actor = await requireTenantAccess(request, parsed.tenantId, returning ? { write: true } : { admin: true, write: true });
      const canReturn = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN_EMPRESA'
        || (actor.topManagement && actor.tenantId === parsed.tenantId);
      if (returning && !canReturn) throw new ApiError(403, 'Solo un administrador o una persona designada como alta dirección puede solicitar ajustes.');
      // El FK compuesto de submittedBy exige que el usuario pertenezca a la
      // empresa de la matriz. Un SUPER_ADMIN puede operar otra empresa, por lo
      // que su identidad se conserva por nombre y en LeadershipRecordEvent,
      // sin crear una referencia inválida entre empresas.
      const submittedById = parsed.action === 'SUBMIT_MATRIX' && actor.tenantId === parsed.tenantId
        ? actor.id
        : null;
      const result = await prisma.$transaction(async tx => {
        const expectedStatus = parsed.action === 'SUBMIT_MATRIX' ? 'BORRADOR' : 'EN_REVISION';
        const nextStatus = parsed.action === 'SUBMIT_MATRIX' ? 'EN_REVISION' : 'BORRADOR';
        const matrix = await tx.responsibilityMatrix.findFirst({ where: { id: parsed.matrixId, tenantId: parsed.tenantId, status: expectedStatus } });
        if (!matrix || matrix.updatedAt.toISOString() !== parsed.expectedUpdatedAt) throw new ApiError(409, 'La matriz cambió o no está en el estado requerido.');
        if (parsed.action === 'RETURN_TO_DRAFT' && parsed.note.trim().length < 10) throw new ApiError(400, 'Indique los ajustes solicitados (mínimo 10 caracteres).');
        if (parsed.action === 'SUBMIT_MATRIX') {
          const { coverage, processes } = await matrixCoverage(tx, parsed.tenantId, matrix.id, matrix.status);
          if (!coverage.structuralReady) throw new ApiError(400, `La matriz no está completa: ${coverageMessage(coverage, processes)}.`);
        }
        const changed = await tx.responsibilityMatrix.updateMany({ where: { id: matrix.id, updatedAt: matrix.updatedAt, status: expectedStatus }, data: {
          status: nextStatus,
          submittedById,
          submittedByName: parsed.action === 'SUBMIT_MATRIX' ? actor.name : null,
          submittedAt: parsed.action === 'SUBMIT_MATRIX' ? new Date() : null,
          updatedById: actor.id, updatedByName: actor.name,
        } });
        if (changed.count !== 1) throw new ApiError(409, 'La matriz cambió. Actualice la página.');
        const updated = await tx.responsibilityMatrix.findUniqueOrThrow({ where: { id: matrix.id } });
        await addEvent(tx, { tenantId: parsed.tenantId, recordType: 'RESPONSIBILITY_MATRIX', recordId: matrix.id, action: parsed.action === 'SUBMIT_MATRIX' ? 'ENVIADA_REVISION' : 'AJUSTES_SOLICITADOS', actor, value: { ...updated, note: parsed.note } });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return NextResponse.json(result);
    }

    if (body?.action === 'APPROVE_MATRIX') {
      const parsed = responsibilityMatrixApprovalSchema.parse(body);
      const actor = await requireTenantAccess(request, parsed.tenantId, { write: true });
      if (!actor.topManagement || actor.tenantId !== parsed.tenantId) throw new ApiError(403, 'La aprobación requiere una persona designada como alta dirección de esta empresa.');
      const result = await prisma.$transaction(async tx => {
        const matrix = await tx.responsibilityMatrix.findFirst({ where: { id: parsed.matrixId, tenantId: parsed.tenantId, status: 'EN_REVISION' } });
        if (!matrix || matrix.updatedAt.toISOString() !== parsed.expectedUpdatedAt) throw new ApiError(409, 'La matriz cambió o ya fue decidida.');
        const { coverage, processes } = await matrixCoverage(tx, parsed.tenantId, matrix.id, matrix.status);
        if (!coverage.structuralReady) throw new ApiError(400, `No puede aprobarse: ${coverageMessage(coverage, processes)}.`);
        const previous = await tx.responsibilityMatrix.findMany({ where: { tenantId: parsed.tenantId, status: 'VIGENTE', id: { not: matrix.id } } });
        for (const item of previous) {
          const obsolete = await tx.responsibilityMatrix.update({ where: { id: item.id }, data: { status: 'OBSOLETA', updatedById: actor.id, updatedByName: actor.name } });
          await addEvent(tx, { tenantId: parsed.tenantId, recordType: 'RESPONSIBILITY_MATRIX', recordId: item.id, action: 'MATRIZ_OBSOLETA', actor, value: obsolete });
        }
        const now = new Date();
        const changed = await tx.responsibilityMatrix.updateMany({ where: { id: matrix.id, status: 'EN_REVISION', updatedAt: matrix.updatedAt }, data: {
          status: 'VIGENTE', approvedById: actor.id, approvedByName: actor.name, approvedAt: now,
          effectiveAt: now, nextReviewAt: new Date(`${parsed.nextReviewAt}T12:00:00Z`), approvalNote: parsed.approvalNote,
          updatedById: actor.id, updatedByName: actor.name,
        } });
        if (changed.count !== 1) throw new ApiError(409, 'La matriz cambió. Actualice la página.');
        const updated = await tx.responsibilityMatrix.findUniqueOrThrow({ where: { id: matrix.id } });
        await addEvent(tx, { tenantId: parsed.tenantId, recordType: 'RESPONSIBILITY_MATRIX', recordId: matrix.id, action: 'MATRIZ_APROBADA', actor, value: updated });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return NextResponse.json(result);
    }

    if (body?.action === 'COMMUNICATE') {
      const parsed = responsibilityCommunicationSchema.parse(body);
      const actor = await requireTenantAccess(request, parsed.tenantId, { admin: true, write: true });
      const result = await prisma.$transaction(async tx => {
        const previous = await tx.responsibilityAssignment.findFirst({ where: { id: parsed.id, tenantId: parsed.tenantId }, include: { matrix: true } });
        if (!previous || !previous.active || !(await lockLiveMatrix(tx, previous.matrixId, parsed.tenantId))) {
          throw new ApiError(409, 'Solo puede comunicarse una asignación activa de la matriz vigente.');
        }
        if (!previous.matrix.effectiveAt || parsed.communicatedAt < previous.matrix.effectiveAt.toISOString().slice(0, 10)) {
          throw new ApiError(400, 'La fecha de comunicación no puede ser anterior a la entrada en vigencia de esta versión.');
        }
        const changed = await tx.responsibilityAssignment.updateMany({ where: { id: previous.id, updatedAt: new Date(parsed.expectedUpdatedAt) }, data: {
          communicatedAt: new Date(`${parsed.communicatedAt}T12:00:00Z`), communicationMethod: parsed.communicationMethod,
          communicationAudience: parsed.communicationAudience, communicationEvidence: parsed.communicationEvidence,
          acknowledgedAt: null, acknowledgedById: null, understandingEvidence: null,
          updatedById: actor.id, updatedByName: actor.name,
        } });
        if (changed.count !== 1) throw new ApiError(409, 'La asignación cambió. Actualice la página.');
        const updated = await tx.responsibilityAssignment.findUniqueOrThrow({ where: { id: previous.id } });
        await addEvent(tx, { tenantId: parsed.tenantId, recordType: 'RESPONSIBILITY', recordId: previous.id, action: 'COMUNICADO', actor, value: updated });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return NextResponse.json(result);
    }

    const acknowledge = body?.action === 'ACKNOWLEDGE';
    const actor = await requireTenantAccess(request, body?.tenantId, acknowledge ? {} : { write: true, admin: true });
    const { tenantId, id, expectedUpdatedAt } = leadershipMutationSchema.parse(body);
    const record = await prisma.$transaction(async tx => {
      const previous = await tx.responsibilityAssignment.findFirst({ where: { id, tenantId }, include: { matrix: true } });
      if (!previous) throw new ApiError(404, 'Asignación no encontrada.');
      if (acknowledge) {
        if (previous.assignedToId !== actor.id) throw new ApiError(403, 'Solo la persona asignada puede confirmar que comprende su rol.');
        if (!previous.active || !(await lockLiveMatrix(tx, previous.matrixId, tenantId))
          || !previous.communicatedAt || !previous.communicationMethod || !previous.communicationAudience || !previous.communicationEvidence) {
          throw new ApiError(400, 'La asignación debe pertenecer a la matriz vigente y estar comunicada antes de confirmar.');
        }
        if (previous.acknowledgedAt) throw new ApiError(409, 'Esta versión ya fue confirmada.');
        const now = new Date();
        const changed = await tx.responsibilityAssignment.updateMany({ where: { id, tenantId, updatedAt: new Date(expectedUpdatedAt), acknowledgedAt: null }, data: {
          acknowledgedAt: now, acknowledgedById: actor.id,
          understandingEvidence: `El titular confirmó que comprende sus responsabilidades y autoridades en la matriz ${previous.matrix.code}, versión ${previous.matrix.version}.`,
          updatedById: actor.id, updatedByName: actor.name,
        } });
        if (changed.count !== 1) throw new ApiError(409, 'La asignación cambió o ya fue confirmada.');
        const updated = await tx.responsibilityAssignment.findUniqueOrThrow({ where: { id } });
        await addEvent(tx, { tenantId, recordType: 'RESPONSIBILITY', recordId: id, action: 'COMPRENSION_CONFIRMADA', actor, value: updated });
        return updated;
      }

      if (previous.matrix.status !== 'BORRADOR') throw new ApiError(409, 'Solo puede editar las filas de una matriz en borrador.');
      const parsed = responsibilityAssignmentSchema.parse(body);
      const [assignee, process] = await Promise.all([
        tx.user.findFirst({ where: { id: parsed.assignedToId, tenantId, active: true }, select: { name: true } }),
        tx.process.findFirst({ where: { id: parsed.processId, tenantId, active: true }, select: { id: true, name: true, responsibleId: true } }),
      ]);
      if (!assignee) throw new ApiError(400, 'Seleccione una persona activa de esta empresa.');
      if (!process) throw new ApiError(400, 'Seleccione un proceso activo de esta empresa.');
      if (parsed.raciRoles.includes('RESPONSABLE') && process.responsibleId !== parsed.assignedToId) throw new ApiError(400, 'La función R debe corresponder al responsable vigente del proceso.');
      const duplicate = await tx.responsibilityAssignment.findFirst({ where: {
        matrixId: previous.matrixId, active: true, processId: process.id, assignedToId: parsed.assignedToId,
        title: parsed.title, id: { not: previous.id },
      }, select: { id: true } });
      if (duplicate) throw new ApiError(409, 'Ya existe esta asignación activa para la persona, cargo y proceso.');
      const claimedMatrix = await tx.responsibilityMatrix.updateMany({
        where: { id: previous.matrixId, tenantId, status: 'BORRADOR', updatedAt: previous.matrix.updatedAt },
        data: { updatedById: actor.id, updatedByName: actor.name },
      });
      if (claimedMatrix.count !== 1) throw new ApiError(409, 'La matriz cambió o dejó de estar en borrador. Actualice la página.');
      const changedContent = assignmentContentChanged(previous, parsed);
      const input = { ...parsed };
      delete input.matrixId;
      const changed = await tx.responsibilityAssignment.updateMany({ where: { id, tenantId, updatedAt: new Date(expectedUpdatedAt) }, data: {
        ...input, processName: process.name, assignedToName: assignee.name,
        ...(changedContent ? { communicatedAt: null, communicationMethod: null, communicationAudience: null, communicationEvidence: null, acknowledgedAt: null, acknowledgedById: null, understandingEvidence: null } : {}),
        updatedById: actor.id, updatedByName: actor.name,
      } });
      if (changed.count !== 1) throw new ApiError(409, 'La asignación cambió. Actualice la página antes de guardar.');
      const updated = await tx.responsibilityAssignment.findUniqueOrThrow({ where: { id } });
      await addEvent(tx, { tenantId, recordType: 'RESPONSIBILITY', recordId: id, action: !updated.active ? 'ARCHIVADO' : 'ACTUALIZADO', actor, value: updated });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(record);
  } catch (error) { return apiError(error); }
}
