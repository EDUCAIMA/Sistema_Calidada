import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const stakeholders = await prisma.stakeholder.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(stakeholders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stakeholders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, tenantId, name, type, needs, expectations, influence, strategy, contactInfo } = body;

        if (!tenantId || !name || !type || !influence) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const data = {
            tenantId,
            name,
            type,
            needs: needs || '',
            expectations: expectations || '',
            influence,
            strategy: strategy || '',
            contactInfo,
        };

        let result;
        if (id && !id.startsWith('sh-')) {
            // Update existing
            result = await prisma.stakeholder.update({
                where: { id },
                data,
            });
        } else {
            // Create new
            result = await prisma.stakeholder.create({
                data,
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error saving stakeholder:', error);
        return NextResponse.json({ error: 'Failed to save stakeholder' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    try {
        await prisma.stakeholder.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete stakeholder' }, { status: 500 });
    }
}
