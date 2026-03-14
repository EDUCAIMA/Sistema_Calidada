import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const items = await prisma.dOFAItem.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch DOFA items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, tenantId, category, description, impact, actions, responsible } = body;

        if (!tenantId || !category || !description) {
            return NextResponse.json({ error: 'Faltan campos obligatorios (tenantId, category, description)' }, { status: 400 });
        }

        // Asegurar que el tenant existe (para evitar errores de FK con IDs de prueba)
        const tenantExists = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenantExists) {
            await prisma.tenant.create({
                data: {
                    id: tenantId,
                    name: 'Empresa Demo',
                    slug: `demo-${tenantId.slice(-4)}`,
                    active: true,
                }
            });
        }

        const data = {
            tenantId,
            category,
            description,
            impact: impact || '',
            actions: actions || '',
            responsible: responsible || '',
        };

        let result;
        if (id && !id.startsWith('dofa-')) {
            // Update existing using cuid
            result = await prisma.dOFAItem.update({
                where: { id },
                data,
            });
        } else {
            // Create new
            result = await prisma.dOFAItem.create({
                data,
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error detallado en DOFA API:', error);
        return NextResponse.json({ 
            error: 'Error al procesar la solicitud en el servidor',
            details: error.message 
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    try {
        await prisma.dOFAItem.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete DOFA item' }, { status: 500 });
    }
}
