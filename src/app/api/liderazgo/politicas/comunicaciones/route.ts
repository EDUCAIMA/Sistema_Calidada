import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId');

    if (!policyId) {
        return NextResponse.json({ error: 'policyId is required' }, { status: 400 });
    }

    try {
        const communications = await prisma.policyCommunication.findMany({
            where: { policyId },
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(communications);
    } catch (error: any) {
        console.error('Error fetching communications:', error);
        return NextResponse.json({ error: 'Failed to fetch communications', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, policyId, audience, method, date, evidence, responsibleName, notes } = body;

        if (!policyId || !audience || !method || !date) {
            return NextResponse.json({ error: 'Faltan campos obligatorios (policyId, audience, method, date)' }, { status: 400 });
        }

        const data = {
            policyId,
            audience,
            method,
            date: new Date(date),
            evidence: evidence || null,
            responsibleName: responsibleName || 'Sin asignar',
            notes: notes || null,
        };

        let result;
        if (id) {
            result = await prisma.policyCommunication.update({
                where: { id },
                data,
            });
        } else {
            result = await prisma.policyCommunication.create({
                data,
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error en PolicyCommunication API:', error);
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
        await prisma.policyCommunication.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting communication:', error);
        return NextResponse.json({ error: 'Failed to delete communication', details: error.message }, { status: 500 });
    }
}
