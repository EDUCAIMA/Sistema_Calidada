import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { policyApproval } from '@/lib/policy-validation';
import { lockPolicyTenant, policyInclude, policySnapshot, requirePolicyVersion } from '@/lib/policy-workflow';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = policyApproval.parse(await request.json());
    const actor = await requireTenantAccess(request, body.tenantId, { admin: true });
    const { id } = await params;
    const result = await prisma.$transaction(async tx => {
      await lockPolicyTenant(tx, body.tenantId);
      const target = requirePolicyVersion(await tx.policy.findFirst({ where: { id, tenantId: body.tenantId } }), body.expectedUpdatedAt);
      if (target.status !== 'EN_REVISION') throw new ApiError(409, 'Solo se aprueban políticas en revisión.');
      if (target.supersedesId && !await tx.policy.findFirst({
        where: { id: target.supersedesId, tenantId: body.tenantId, status: 'VIGENTE' },
      })) throw new ApiError(409, 'La versión de origen ya fue reemplazada. Revise el contenido antes de aprobar.');
      const types = ['General', 'Calidad'].includes(target.type) ? ['General', 'Calidad'] : [target.type];
      const previous = await tx.policy.findMany({ where: {
        tenantId: body.tenantId, type: { in: types }, status: 'VIGENTE', id: { not: id },
      } });
      if (previous.length && !target.supersedesId) {
        throw new ApiError(409, 'Ya existe una política vigente de este tipo. Cree una nueva versión desde ella para conservar el vínculo de revisión.');
      }
      for (const item of previous) {
        await tx.policy.update({ where: { id: item.id }, data: {
          status: 'OBSOLETA', approvalEvents: { create: {
            action: 'SUPERSEDED', fromStatus: 'VIGENTE', toStatus: 'OBSOLETA',
            userId: actor.id, userName: actor.name, note: 'Reemplazada por ' + target.title + ', versión ' + target.version + '.',
            snapshot: policySnapshot(item),
          } },
        } });
      }
      const policy = await tx.policy.update({
        where: { id }, data: {
          status: 'VIGENTE', approvedById: actor.id, approvedByName: actor.name, approvedAt: new Date(),
          approvalChecks: body.checks, approvalEvents: { create: {
            action: 'APPROVED', fromStatus: 'EN_REVISION', toStatus: 'VIGENTE',
            userId: actor.id, userName: actor.name, note: body.note || 'Revisados contexto, marco de objetivos, requisitos aplicables y mejora continua.',
            snapshot: policySnapshot(target),
          } },
        }, include: policyInclude,
      });
      return { policy, supersededPolicyIds: previous.map(item => item.id) };
    });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
