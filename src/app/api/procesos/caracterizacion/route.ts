import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '@/lib/db';
import { ApiError, apiError, requireTenantAccess } from '@/lib/api-auth';
import { getAuthenticatedUser } from '@/lib/auth-session';

const characterizationSchema = z.object({
  processId: z.string().trim().min(1, 'processId es requerido'),
  version: z.string().trim().max(100).optional(),
  date: z.string().trim().max(100).optional(),
  planear: z.unknown().optional(),
  hacer: z.unknown().optional(),
  verificar: z.unknown().optional(),
  actuar: z.unknown().optional(),
  resources: z.unknown().optional(),
  indicators: z.unknown().optional(),
  documents: z.unknown().optional(),
  risks: z.unknown().optional(),
  objective: z.string().max(5000).nullable().optional(),
  scope: z.string().max(5000).nullable().optional(),
  responsibleId: z.string().trim().min(1).nullable().optional(),
});

const jsonOrEmpty = (value: unknown) => (value || []) as Prisma.InputJsonValue;

export async function POST(request: Request) {
  try {
    const body = characterizationSchema.parse(await request.json());
    const sessionUser = await getAuthenticatedUser(request);
    if (!sessionUser) throw new ApiError(401, 'La sesión expiró. Inicie sesión nuevamente.');

    const process = await prisma.process.findFirst({
      where: {
        id: body.processId,
        active: true,
        ...(sessionUser.role === 'SUPER_ADMIN' ? {} : { tenantId: sessionUser.tenantId }),
      },
      select: { id: true, tenantId: true },
    });
    if (!process) throw new ApiError(404, 'Proceso activo no encontrado.');
    await requireTenantAccess(request, process.tenantId, { write: true });

    const characterization = await prisma.$transaction(async tx => {
      const responsible = body.responsibleId
        ? await tx.user.findFirst({
          where: { id: body.responsibleId, tenantId: process.tenantId, active: true },
          select: { id: true, name: true },
        })
        : null;
      if (body.responsibleId && !responsible) {
        throw new ApiError(400, 'El responsable debe ser un usuario activo de la empresa.');
      }

      const claimed = await tx.process.updateMany({
        where: { id: process.id, tenantId: process.tenantId, active: true },
        data: {
          updatedAt: new Date(),
          ...(body.objective !== undefined && body.objective !== null ? { objective: body.objective } : {}),
          ...(body.scope !== undefined && body.scope !== null ? { scope: body.scope } : {}),
          ...(responsible ? { responsibleId: responsible.id, responsibleName: responsible.name } : {}),
        },
      });
      if (claimed.count !== 1) throw new ApiError(409, 'El proceso cambió o dejó de estar activo.');

      return tx.processCharacterization.upsert({
        where: { processId: process.id },
        update: {
          version: body.version || '1',
          date: body.date || new Date().toLocaleDateString(),
          planear: jsonOrEmpty(body.planear),
          hacer: jsonOrEmpty(body.hacer),
          verificar: jsonOrEmpty(body.verificar),
          actuar: jsonOrEmpty(body.actuar),
          resources: jsonOrEmpty(body.resources),
          indicators: jsonOrEmpty(body.indicators),
          documents: jsonOrEmpty(body.documents),
          risks: jsonOrEmpty(body.risks),
        },
        create: {
          processId: process.id,
          version: body.version || '1',
          date: body.date || new Date().toLocaleDateString(),
          planear: jsonOrEmpty(body.planear),
          hacer: jsonOrEmpty(body.hacer),
          verificar: jsonOrEmpty(body.verificar),
          actuar: jsonOrEmpty(body.actuar),
          resources: jsonOrEmpty(body.resources),
          indicators: jsonOrEmpty(body.indicators),
          documents: jsonOrEmpty(body.documents),
          risks: jsonOrEmpty(body.risks),
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json(characterization);
  } catch (error) {
    return apiError(error);
  }
}
