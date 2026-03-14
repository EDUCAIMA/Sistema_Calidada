import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
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
        console.error('Error fetching all tenants:', error);
        return NextResponse.json(
            { error: 'Error al obtener las empresas' },
            { status: 500 }
        );
    }
}
