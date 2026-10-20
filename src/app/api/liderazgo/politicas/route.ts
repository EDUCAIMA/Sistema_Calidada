import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { policyInput, policyRevisionIsNewer } from '@/lib/policy-validation';
import { lockPolicyTenant, policyInclude, policySnapshot, requirePolicyVersion } from '@/lib/policy-workflow';

export async function GET(request: Request) {
  try {
    const tenantId = new URL(request.url).searchParams.get('tenantId');
    await requireTenantAccess(request, tenantId);
    return NextResponse.json(await prisma.policy.findMany({
      where: { tenantId: tenantId! }, include: policyInclude, orderBy: { createdAt: 'desc' },
    }));
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = policyInput.parse(await request.json());
    const actor = await requireTenantAccess(request, body.tenantId, { write: true });
    const result = await prisma.$transaction(async tx => {
      await lockPolicyTenant(tx, body.tenantId);
      if (body.id) {
        const existing = requirePolicyVersion(await tx.policy.findFirst({
          where: { id: body.id, tenantId: body.tenantId },
        }), body.expectedUpdatedAt);
        if (existing.status !== 'BORRADOR') throw new ApiError(409, 'Solo se editan borradores. Solicite ajustes o cree una nueva versión.');
        return tx.policy.update({
          where: { id: existing.id },
          data: {
            title: body.title, content: body.content, objectives: body.objectives,
            approvalEvents: { create: {
              action: 'EDITED', fromStatus: 'BORRADOR', toStatus: 'BORRADOR',
              userId: actor.id, userName: actor.name, note: 'Contenido del borrador actualizado.',
              snapshot: policySnapshot({ ...existing, ...body, type: existing.type, version: existing.version }),
            } },
          }, include: policyInclude,
        });
      }
      const types = ['General', 'Calidad'].includes(body.type) ? ['General', 'Calidad'] : [body.type];
      if (!body.supersedesId && await tx.policy.findFirst({ where: {
        tenantId: body.tenantId, type: { in: types }, status: 'VIGENTE',
      } })) throw new ApiError(409, 'Ya existe una política vigente de este tipo. Use Nueva versión para conservar su trazabilidad.');
      if (body.supersedesId) {
        const source = await tx.policy.findFirst({ where: { id: body.supersedesId, tenantId: body.tenantId, status: 'VIGENTE' } });
        if (!source) throw new ApiError(409, 'La versión de origen ya no está vigente.');
        if (source.type !== body.type || !policyRevisionIsNewer(body.version, source.version)) {
          throw new ApiError(400, 'La nueva versión debe conservar el tipo y superar la versión vigente.');
        }
        if (await tx.policy.findFirst({ where: { supersedesId: source.id, status: { in: ['BORRADOR', 'EN_REVISION'] } } })) {
          throw new ApiError(409, 'Ya existe una nueva versión pendiente para esta política.');
        }
      }
      return tx.policy.create({
        data: {
          tenantId: body.tenantId, title: body.title, content: body.content, type: body.type,
          version: body.version, objectives: body.objectives, supersedesId: body.supersedesId,
          status: 'BORRADOR', author: actor.name,
          approvalEvents: { create: {
            action: 'CREATED', fromStatus: 'BORRADOR', toStatus: 'BORRADOR',
            userId: actor.id, userName: actor.name, note: 'Borrador creado.',
            snapshot: policySnapshot({ ...body, objectives: body.objectives }),
          } },
        }, include: policyInclude,
      });
    });
    return NextResponse.json(result, { status: body.id ? 200 : 201 });
  } catch (error) { return apiError(error); }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Se conserva el historial de políticas. Las versiones anteriores se archivan al aprobar su reemplazo.' }, { status: 405 });
}
