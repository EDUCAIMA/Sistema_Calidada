import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const processes = await prisma.process.findMany({
            where: { tenantId, active: true },
            orderBy: { order: 'asc' },
            include: {
                characterization: true,
                responsible: {
                    select: { name: true }
                }
            }
        });
        
        // Flatten responsible name for frontend compatibility
        const formatted = processes.map((p: any) => ({
            ...p,
            responsibleName: p.responsibleName || p.responsible?.name || '—'
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching processes:', error);
        return NextResponse.json({ error: 'Failed to fetch processes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, tenantId, name, code, category, objective, scope, responsibleId } = body;

        if (!tenantId || !name || !code || !category || !responsibleId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const data = {
            tenantId,
            name,
            code,
            category,
            objective: objective || '',
            scope: scope || '',
            responsibleId,
            order: 0, // Simplified for now
        };

        let result;
        if (id && !id.startsWith('proc-')) {
            result = await prisma.process.update({
                where: { id },
                data,
            });
        } else {
            result = await prisma.process.create({
                data,
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error saving process:', error);
        return NextResponse.json({ error: 'Failed to save process' }, { status: 500 });
    }
}
