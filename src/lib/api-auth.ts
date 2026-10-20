import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import prisma from '@/lib/db';
import { canAccessTenant, getAuthenticatedUser } from '@/lib/auth-session';

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function requireTenantAccess(
  request: Request,
  tenantId: unknown,
  options: { write?: boolean; admin?: boolean } = {},
) {
  const actor = await getAuthenticatedUser(request);
  if (!actor) throw new ApiError(401, 'La sesión expiró. Inicie sesión nuevamente.');
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new ApiError(400, 'La empresa es obligatoria.');
  }
  if (!canAccessTenant(actor.role, actor.tenantId, tenantId)) {
    throw new ApiError(403, 'No tiene acceso a esta empresa.');
  }
  const admin = actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN_EMPRESA';
  if (options.admin && !admin) throw new ApiError(403, 'Esta acción requiere un administrador.');
  if (options.write && !admin && actor.role !== 'USUARIO') {
    throw new ApiError(403, 'El perfil de auditor tiene acceso de solo lectura.');
  }
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, active: true }, select: { id: true } });
  if (!tenant) throw new ApiError(403, 'La empresa no está activa o no existe.');
  return actor;
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues.map(issue => issue.message).join(' ') }, { status: 400 });
  }
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'La solicitud no contiene JSON válido.' }, { status: 400 });
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2034' || error.code === 'P2002') {
      return NextResponse.json({ error: 'El registro cambió o ya existe. Actualice la página e intente nuevamente.' }, { status: 409 });
    }
    if (error.code === 'P2025') return NextResponse.json({ error: 'Registro no encontrado o modificado por otro usuario.' }, { status: 409 });
  }
  console.error('Error procesando registro del SGC:', error);
  return NextResponse.json({ error: 'No fue posible procesar la solicitud.' }, { status: 500 });
}
