import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            include: {
                tenant: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        return NextResponse.json(
            { error: 'Error al obtener los usuarios' },
            { status: 500 }
        );
    }
}
