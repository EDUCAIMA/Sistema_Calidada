import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    console.log('API GET: Fetching objectives for tenantId:', tenantId);

    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    try {
        const objectives = await prisma.qualityObjective.findMany({
            where: { tenantId },
            include: {
                tracking: {
                    orderBy: { date: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`API GET: Found ${objectives.length} objectives for tenant ${tenantId}`);
        return NextResponse.json(objectives);
    } catch (error: any) {
        console.error('Error fetching objectives:', error);
        return NextResponse.json({ error: error.message || 'Error fetching objectives' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, tenantId, description, indicator, target, responsible, deadline, evaluationFreq, resources, status, progress } = body;

        console.log('API POST: Saving objective for tenantId:', tenantId, 'ID:', id || 'NEW');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
        }

        if (id) {
            // Update existing
            const updated = await prisma.qualityObjective.update({
                where: { id },
                data: {
                    description,
                    indicator: indicator || '',
                    target,
                    responsibleName: responsible,
                    deadline: deadline ? new Date(deadline) : null,
                    evaluationFreq,
                    resources,
                    status: status || 'En progreso',
                    progress: progress || 0
                }
            });
            return NextResponse.json(updated);
        } else {
            // Create new
            const created = await prisma.qualityObjective.create({
                data: {
                    tenantId,
                    description,
                    indicator: indicator || '',
                    target,
                    responsibleName: responsible,
                    deadline: deadline ? new Date(deadline) : new Date(),
                    evaluationFreq,
                    resources,
                    status: status || 'En progreso',
                    progress: progress || 0
                }
            });
            return NextResponse.json(created);
        }
    } catch (error) {
        console.error('Error saving objective:', error);
        return NextResponse.json({ error: 'Error saving objective' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await prisma.qualityObjective.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting objective:', error);
        return NextResponse.json({ error: 'Error deleting objective' }, { status: 500 });
    }
}
