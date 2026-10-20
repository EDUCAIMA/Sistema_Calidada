import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { ApiError, apiError } from '@/lib/api-auth';

export async function GET(request: Request) {
    try {
        const actor = await getAuthenticatedUser(request);
        if (!actor) throw new ApiError(401, 'Inicie sesión nuevamente.');
        if (actor.role !== 'SUPER_ADMIN') throw new ApiError(403, 'La consulta global requiere un superadministrador.');
        const tenants = await prisma.tenant.findMany({
            include: {
                users: {
                    select: {
                        email: true,
                        role: true,
                        name: true
                    },
                    where: {
                        role: 'ADMIN_EMPRESA'
                    },
                    take: 1
                },
                _count: {
                    select: { users: true }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(tenants);
    } catch (error) {
        return apiError(error);
    }
}
