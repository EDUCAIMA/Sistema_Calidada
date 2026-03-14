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
            return NextResponse.json({ error: 'Faltan campos obligatorios (tenantId, scopeStatement)' }, { status: 400 });
        }

        // Asegurar que el tenant existe
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
            // Update existing
            result = await prisma.sGCScope.update({
                where: { id },
                data,
            });
        } else {
            // Create new
            result = await prisma.sGCScope.create({
                data,
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error detallado en Alcance API:', error);
        return NextResponse.json({ 
            error: 'Error al procesar la solicitud en el servidor',
            details: error.message 
        }, { status: 500 });
    }
}
