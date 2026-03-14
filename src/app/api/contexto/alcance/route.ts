import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    try {
        const scope = await prisma.sGCScope.findFirst({
            where: { tenantId },
            orderBy: { lastReviewDate: 'desc' },
        });
        return NextResponse.json(scope);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch scope' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, tenantId, scopeStatement, approvedBy } = body;

        if (!tenantId || !scopeStatement) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const data = {
            tenantId,
            scopeStatement,
            applicableStandards: [],
            exclusions: [],
            sites: [],
            processes: [],
            lastReviewDate: new Date(),
            approvedBy: approvedBy || 'Admin',
        };

        let result;
        if (id) {
            result = await prisma.sGCScope.update({
                where: { id },
                data,
            });
        } else {
            result = await prisma.sGCScope.create({
                data,
            });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error saving scope:', error);
        return NextResponse.json({ error: 'Failed to save scope' }, { status: 500 });
    }
}
