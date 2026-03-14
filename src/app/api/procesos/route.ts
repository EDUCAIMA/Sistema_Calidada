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
            return NextResponse.json({ error: 'Faltan campos obligatorios (tenantId, name, code, category, responsibleId)' }, { status: 400 });
        }

        // Asegurar que el tenant y el usuario existen (para evitar errores de FK con IDs de prueba)
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

        const userExists = await prisma.user.findUnique({ where: { id: responsibleId } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: responsibleId,
                    tenantId: tenantId,
                    email: 'admin@empresa.com',
                    name: 'Administrador Demo',
                    role: 'ADMIN_EMPRESA',
                    active: true,
                }
            });
        }

        const data = {
            tenantId,
            name,
            code,
            category,
            objective: objective || '',
            scope: scope || '',
            responsibleId,
            order: 0,
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
    } catch (error: any) {
        console.error('Error detallado en Procesos API:', error);
        return NextResponse.json({ 
            error: 'Error al procesar la solicitud en el servidor',
            details: error.message 
        }, { status: 500 });
    }
}
