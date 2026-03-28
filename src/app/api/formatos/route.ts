import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');
    const moduleKey = searchParams.get('moduleKey');

    if (!tenantId || !moduleKey) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    try {
        const format = await prisma.formatControl.findUnique({
            where: {
                tenantId_moduleKey: {
                    tenantId,
                    moduleKey
                }
            }
        });

        return NextResponse.json(format || { error: 'No encontrado' });
    } catch (error) {
        console.error('Error fetching format control:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Saving format control:', body);
        const { tenantId, moduleKey, code, version, approvalDate } = body;

        if (!tenantId || !moduleKey || !code || !version || !approvalDate) {
            return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
        }

        const format = await prisma.formatControl.upsert({
            where: {
                tenantId_moduleKey: {
                    tenantId,
                    moduleKey
                }
            },
            update: {
                code,
                version,
                approvalDate
            },
            create: {
                tenantId,
                moduleKey,
                code,
                version,
                approvalDate
            }
        });

        return NextResponse.json(format);
    } catch (error: any) {
        console.error('Error saving format control:', error);
        return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
}
