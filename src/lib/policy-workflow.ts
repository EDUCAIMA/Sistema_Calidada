import type { Policy, Prisma } from '@prisma/client';
import { ApiError } from '@/lib/api-auth';

export const policyInclude = {
  communications: { orderBy: { date: 'desc' as const } },
  approvalEvents: { orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }] },
};

export async function lockPolicyTenant(tx: Prisma.TransactionClient, tenantId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Tenant" WHERE "id" = ${tenantId} FOR UPDATE`;
}

export function requirePolicyVersion(policy: Policy | null, expected?: string) {
  if (!policy) throw new ApiError(404, 'Política no encontrada.');
  if (!expected || policy.updatedAt.toISOString() !== expected) {
    throw new ApiError(409, 'La política cambió. Actualice la página antes de continuar.');
  }
  return policy;
}

export function policySnapshot(policy: Pick<Policy, 'title' | 'content' | 'type' | 'version' | 'objectives'>) {
  return JSON.parse(JSON.stringify({
    title: policy.title, content: policy.content, type: policy.type,
    version: policy.version, objectives: policy.objectives,
  })) as Prisma.InputJsonValue;
}
