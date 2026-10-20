import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { policyCommunicationInput } from '@/lib/policy-validation';
import { lockPolicyTenant } from '@/lib/policy-workflow';

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const tenantId = query.get('tenantId');
    await requireTenantAccess(request, tenantId);
    const policy = await prisma.policy.findFirst({ where: { id: query.get('policyId') || '', tenantId: tenantId! } });
    if (!policy) throw new ApiError(404, 'Política no encontrada.');
    return NextResponse.json(await prisma.policyCommunication.findMany({ where: { policyId: policy.id }, orderBy: { date: 'desc' } }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = policyCommunicationInput.parse(await request.json());
    const actor = await requireTenantAccess(request, body.tenantId, { write: true });
    const result = await prisma.$transaction(async tx => {
      await lockPolicyTenant(tx, body.tenantId);
      const policy = await tx.policy.findFirst({ where: { id: body.policyId, tenantId: body.tenantId } });
      if (!policy) throw new ApiError(404, 'Política no encontrada.');
      if (policy.status !== 'VIGENTE') throw new ApiError(409, 'La comunicación debe corresponder a una política vigente.');
      return tx.policyCommunication.create({ data: {
        policyId: policy.id, audience: body.audience, audienceType: body.audienceType,
        method: body.method, date: new Date(body.date + 'T12:00:00Z'), evidence: body.evidence,
        understandingEvidence: body.understandingEvidence || null, notes: body.notes || null,
        responsibleName: actor.name, registeredById: actor.id,
      } });
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return apiError(error); }
}

export async function DELETE() {
  return NextResponse.json({ error: 'La evidencia de comunicación se conserva. Registre una aclaración como nueva evidencia.' }, { status: 405 });
}
