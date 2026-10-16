import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const users = await prisma.user.findMany({
            where: tenantId ? { tenantId, active: true } : undefined,
            select: {
                id: true,
                tenantId: true,
                email: true,
                name: true,
                position: true,
                role: true,
                avatar: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                phone: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        plan: true,
                        active: true,
                        createdAt: true,
                    },
                },
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
    } catch (error: unknown) {
        console.error('Error creating user:', error);
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
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
