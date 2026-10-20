import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { leadershipCommitmentSchema, leadershipMutationSchema } from '@/lib/leadership';

export async function GET(request: Request) {
  try {
    const tenantId = new URL(request.url).searchParams.get('tenantId');
    await requireTenantAccess(request, tenantId);
    const [records, users, events] = await Promise.all([
      prisma.leadershipCommitment.findMany({ where: { tenantId: tenantId! }, orderBy: { dueDate: 'asc' } }),
      prisma.user.findMany({ where: { tenantId: tenantId!, active: true }, select: { id: true, name: true, position: true }, orderBy: { name: 'asc' } }),
      prisma.leadershipRecordEvent.findMany({ where: { tenantId: tenantId!, recordType: 'COMMITMENT' }, orderBy: { createdAt: 'desc' } }),
    ]);
    return NextResponse.json({ records, users, events });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = await requireTenantAccess(request, body?.tenantId, { write: true });
    const parsed = leadershipCommitmentSchema.parse(body);
    if (parsed.status === 'CERRADA') throw new ApiError(400, 'Registre primero el compromiso abierto y cierre después de evaluar sus resultados.');
    const responsible = await prisma.user.findFirst({ where: { id: parsed.responsibleId, tenantId: body.tenantId, active: true }, select: { id: true, name: true } });
    if (!responsible) throw new ApiError(400, 'Seleccione un responsable activo de esta empresa.');
    const record = await prisma.$transaction(async tx => {
      const created = await tx.leadershipCommitment.create({ data: {
        ...parsed, dueDate: new Date(`${parsed.dueDate}T12:00:00Z`), tenantId: body.tenantId,
        responsibleName: responsible.name, createdById: actor.id, createdByName: actor.name,
        updatedById: actor.id, updatedByName: actor.name,
      } });
      await tx.leadershipRecordEvent.create({ data: { tenantId: body.tenantId, recordType: 'COMMITMENT', recordId: created.id, action: 'CREADO', userId: actor.id, userName: actor.name, snapshot: JSON.parse(JSON.stringify(created)) } });
      return created;
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const actor = await requireTenantAccess(request, body?.tenantId, { write: true });
    const { tenantId, id, expectedUpdatedAt } = leadershipMutationSchema.parse(body);
    const parsed = leadershipCommitmentSchema.parse(body);
    const responsible = await prisma.user.findFirst({ where: { id: parsed.responsibleId, tenantId, active: true }, select: { name: true } });
    if (!responsible) throw new ApiError(400, 'Seleccione un responsable activo de esta empresa.');
    const record = await prisma.$transaction(async tx => {
      const previous = await tx.leadershipCommitment.findFirst({ where: { id, tenantId } });
      if (!previous) throw new ApiError(404, 'Compromiso no encontrado.');
      const changed = await tx.leadershipCommitment.updateMany({
        where: { id, tenantId, updatedAt: new Date(expectedUpdatedAt) },
        data: { ...parsed, dueDate: new Date(`${parsed.dueDate}T12:00:00Z`), responsibleName: responsible.name, updatedById: actor.id, updatedByName: actor.name },
      });
      if (changed.count !== 1) throw new ApiError(409, 'El compromiso cambió. Actualice la página antes de guardar.');
      const updated = await tx.leadershipCommitment.findUniqueOrThrow({ where: { id } });
      const action = previous.status !== 'CERRADA' && parsed.status === 'CERRADA' ? 'CERRADO' : previous.status === 'CERRADA' && parsed.status !== 'CERRADA' ? 'REABIERTO' : 'ACTUALIZADO';
      await tx.leadershipRecordEvent.create({ data: { tenantId, recordType: 'COMMITMENT', recordId: id, action, userId: actor.id, userName: actor.name, snapshot: JSON.parse(JSON.stringify(updated)) } });
      return updated;
    });
    return NextResponse.json(record);
  } catch (error) { return apiError(error); }
}
