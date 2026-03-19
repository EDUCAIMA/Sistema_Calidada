import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, industry, timezone, currency, phone, logo } = body;

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                industry,
                timezone,
                currency,
                phone,
                logo
            },
        });

        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error('Error updating tenant:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la empresa' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tenant = await prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Empresa no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error('Error fetching tenant:', error);
        return NextResponse.json(
            { error: 'Error al obtener la empresa' },
            { status: 500 }
        );
    }
}
