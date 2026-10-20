import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { policyDecision } from '@/lib/policy-validation';
import { lockPolicyTenant, policyInclude, policySnapshot, requirePolicyVersion } from '@/lib/policy-workflow';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = policyDecision.parse(await request.json());
    const actor = await requireTenantAccess(request, body.tenantId, { write: true });
    const { id } = await params;
    const result = await prisma.$transaction(async tx => {
      await lockPolicyTenant(tx, body.tenantId);
      const policy = requirePolicyVersion(await tx.policy.findFirst({ where: { id, tenantId: body.tenantId } }), body.expectedUpdatedAt);
      if (policy.status !== 'BORRADOR') throw new ApiError(409, 'Solo un borrador se puede enviar a revisión.');
      if (!policy.content.trim()) throw new ApiError(400, 'Complete el contenido de la política.');
      return tx.policy.update({
        where: { id }, data: { status: 'EN_REVISION', approvalEvents: { create: {
          action: 'SUBMITTED_FOR_REVIEW', fromStatus: 'BORRADOR', toStatus: 'EN_REVISION',
          userId: actor.id, userName: actor.name, note: body.note || 'Enviada a revisión por la dirección.',
          snapshot: policySnapshot(policy),
        } } }, include: policyInclude,
      });
    });
    return NextResponse.json(result);
  } catch (error) { return apiError(error); }
}
