import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { policyDecision } from '@/lib/policy-validation';
import { lockPolicyTenant, policyInclude, policySnapshot, requirePolicyVersion } from '@/lib/policy-workflow';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = policyDecision.parse(await request.json());
    if (!body.note) throw new ApiError(400, 'Describa los ajustes requeridos.');
    const actor = await requireTenantAccess(request, body.tenantId, { admin: true });
    const { id } = await params;
    const result = await prisma.$transaction(async tx => {
      await lockPolicyTenant(tx, body.tenantId);
      const policy = requirePolicyVersion(await tx.policy.findFirst({ where: { id, tenantId: body.tenantId } }), body.expectedUpdatedAt);
      if (policy.status !== 'EN_REVISION') throw new ApiError(409, 'Solo se devuelven políticas en revisión.');
      return tx.policy.update({ where: { id }, data: {
        status: 'BORRADOR', approvalEvents: { create: {
          action: 'CHANGES_REQUESTED', fromStatus: 'EN_REVISION', toStatus: 'BORRADOR',
          userId: actor.id, userName: actor.name, note: body.note, snapshot: policySnapshot(policy),
        } },
      }, include: policyInclude });
    });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
