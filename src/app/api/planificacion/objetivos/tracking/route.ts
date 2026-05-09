import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { objectiveId, note, progress } = body;

        if (!objectiveId || !note) {
            return NextResponse.json({ error: 'Objective ID and note are required' }, { status: 400 });
        }

        // 1. Create the tracking record
        const tracking = await prisma.objectiveTracking.create({
            data: {
                objectiveId,
                note,
                progress: Number(progress)
            }
        });

        // 2. Update the main objective with the latest progress
        await prisma.qualityObjective.update({
            where: { id: objectiveId },
            data: {
                progress: Number(progress)
            }
        });

        return NextResponse.json(tracking);
    } catch (error) {
        console.error('Error saving tracking:', error);
        return NextResponse.json({ error: 'Error saving tracking' }, { status: 500 });
    }
}
