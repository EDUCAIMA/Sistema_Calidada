import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, role, tenantId, position, active } = body;

        if (!email || !name || !role || !tenantId) {
            return NextResponse.json(
                { error: 'Faltan campos obligatorios' },
                { status: 400 }
            );
        }

        // Hash password if provided, otherwise null (or default)
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                tenantId,
                position,
                active: active ?? true,
            },
            include: {
                tenant: true,
            }
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        console.error('Error creating user:', error);
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'El email ya está registrado' },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Error al crear el usuario' },
            { status: 500 }
        );
    }
}
