import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const policies = await prisma.policy.findMany({
            where: { tenantId },
            include: {
                communications: {
                    orderBy: { date: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(policies);
    } catch (error: any) {
        console.error('Error fetching policies:', error);
        return NextResponse.json({ error: 'Failed to fetch policies', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, tenantId, title, content, type, version, status, author, objectives } = body;

        if (!tenantId || !title || !content) {
            return NextResponse.json({ error: 'Faltan campos obligatorios (tenantId, title, content)' }, { status: 400 });
        }

        // Asegurar que el tenant existe
        const tenantExists = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenantExists) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        const data = {
            tenantId,
            title,
            content,
            type: type || 'General',
            version: version || '1.0',
            status: status || 'EN_REVISION',
            author: author || 'Sin asignar',
            objectives: objectives || [],
        };

        let result;
        if (id) {
            // Update existing
            result = await prisma.policy.update({
                where: { id },
                data,
                include: { communications: true },
            });
        } else {
            // Create new
            result = await prisma.policy.create({
                data,
                include: { communications: true },
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error en Policy API:', error);
        return NextResponse.json({
            error: 'Error al procesar la solicitud',
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
        await prisma.policy.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting policy:', error);
        return NextResponse.json({ error: 'Failed to delete policy', details: error.message }, { status: 500 });
    }
}
