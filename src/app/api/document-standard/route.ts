import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { documentStandardSchema, parseDocumentStandardConfig } from '@/lib/document-standard';

const MAX_LOGO_BYTES = 512 * 1024;

function isSafeLogo(value: string) {
  if (value.startsWith('https://')) {
    try {
      const url = new URL(value);
      return value.length <= 2048 && !url.username && !url.password && Boolean(url.hostname);
    } catch { return false; }
  }
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES) return false;
  if (match[1] === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
}

const updateSchema = z.object({
  tenantId: z.string().trim().min(1).max(100),
  revision: z.number().int().min(0),
  config: documentStandardSchema,
  logo: z.string().max(710000).refine(isSafeLogo, 'El logo debe ser PNG/JPEG de hasta 512 KB o una URL HTTPS.').nullable().optional(),
}).strict();

async function loadStandard(tenantId: string) {
  const [tenant, standard, formats] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, logo: true } }),
    prisma.documentStandard.findUnique({ where: { tenantId } }),
    prisma.formatControl.findMany({ where: { tenantId }, orderBy: { moduleKey: 'asc' } }),
  ]);
  if (!tenant) throw new ApiError(404, 'Empresa no encontrada.');
  return {
    tenant,
    config: parseDocumentStandardConfig(standard?.config),
    revision: standard?.revision ?? 0,
    formats,
  };
}

export async function GET(request: Request) {
  try {
    const tenantId = new URL(request.url).searchParams.get('tenantId')?.trim() ?? '';
    await requireTenantAccess(request, tenantId);
    return NextResponse.json(await loadStandard(tenantId));
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const body = updateSchema.parse(await request.json());
    const actor = await requireTenantAccess(request, body.tenantId, { admin: true });
    await prisma.$transaction(async transaction => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${body.tenantId}, 61020001))`;
      if (body.revision === 0) {
        await transaction.documentStandard.create({
          data: { tenantId: body.tenantId, config: body.config, revision: 1, updatedBy: actor.id },
        });
      } else {
        const result = await transaction.documentStandard.updateMany({
          where: { tenantId: body.tenantId, revision: body.revision },
          data: { config: body.config, revision: { increment: 1 }, updatedBy: actor.id },
        });
        if (result.count !== 1) {
          throw new ApiError(409, 'Otro administrador modificó el estándar. Recargue la página antes de guardar.');
        }
      }
      if (body.logo !== undefined) {
        await transaction.tenant.update({ where: { id: body.tenantId }, data: { logo: body.logo } });
      }
    });
    return NextResponse.json(await loadStandard(body.tenantId));
  } catch (error) { return apiError(error); }
}
