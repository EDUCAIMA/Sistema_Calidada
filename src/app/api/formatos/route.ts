import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { apiError, requireTenantAccess } from '@/lib/api-auth';

function isValidApprovalDate(value: string) {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) === 0) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const formatSchema = z.object({
  tenantId: z.string().trim().min(1).max(100),
  moduleKey: z.string().trim().min(1).max(100),
  code: z.string().trim().min(1).max(100),
  version: z.string().trim().min(1).max(30),
  approvalDate: z.string().trim().max(50).refine(
    isValidApprovalDate,
    'La fecha debe estar vacía o ser una fecha real en formato AAAA-MM-DD.',
  ),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId')?.trim() ?? '';
        const moduleKey = searchParams.get('moduleKey')?.trim() ?? '';
        await requireTenantAccess(request, tenantId);
        if (!moduleKey) return NextResponse.json({ error: 'El módulo es obligatorio.' }, { status: 400 });
        const format = await prisma.formatControl.findUnique({
            where: {
                tenantId_moduleKey: {
                    tenantId,
                    moduleKey
                }
            }
        });

        return NextResponse.json(format || { error: 'No encontrado' });
    } catch (error) {
        return apiError(error);
    }
}

export async function POST(req: Request) {
    try {
        const { tenantId, moduleKey, code, version, approvalDate } = formatSchema.parse(await req.json());
        await requireTenantAccess(req, tenantId, { admin: true });

        const format = await prisma.formatControl.upsert({
            where: {
                tenantId_moduleKey: {
                    tenantId,
                    moduleKey
                }
            },
            update: {
                code,
                version,
                approvalDate
            },
            create: {
                tenantId,
                moduleKey,
                code,
                version,
                approvalDate
            }
        });

        return NextResponse.json(format);
    } catch (error) {
        return apiError(error);
    }
}
