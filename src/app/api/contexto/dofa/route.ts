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
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const data = {
            tenantId,
            category,
            description,
            impact,
            actions,
            responsible,
        };

        let result;
        if (id && !id.startsWith('dofa-')) {
            // Update existing
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
    } catch (error) {
        console.error('Error saving DOFA item:', error);
        return NextResponse.json({ error: 'Failed to save DOFA item' }, { status: 500 });
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
