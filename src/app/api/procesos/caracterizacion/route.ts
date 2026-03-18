import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { 
            processId, 
            version, 
            date, 
            planear, 
            hacer, 
            verificar, 
            actuar, 
            resources, 
            indicators, 
            documents, 
            risks,
            // Agregamos actualización opcional de campos del proceso principal
            objective,
            scope,
            responsibleId
        } = body;

        if (!processId) {
            return NextResponse.json({ error: 'processId es requerido' }, { status: 400 });
        }

        // 1. Actualizar el proceso principal si se proporcionan datos
        if (objective !== undefined || scope !== undefined || responsibleId !== undefined) {
          await prisma.process.update({
            where: { id: processId },
            data: {
              ...(objective !== undefined && { objective }),
              ...(scope !== undefined && { scope }),
              ...(responsibleId !== undefined && { responsibleId }),
            }
          });
        }

        // 2. Upsert de la caracterización
        const characterization = await prisma.processCharacterization.upsert({
            where: { processId },
            update: {
                version: version || '1',
                date: date || new Date().toLocaleDateString(),
                planear: planear || [],
                hacer: hacer || [],
                verificar: verificar || [],
                actuar: actuar || [],
                resources: resources || [],
                indicators: indicators || [],
                documents: documents || [],
                risks: risks || [],
            },
            create: {
                processId,
                version: version || '1',
                date: date || new Date().toLocaleDateString(),
                planear: planear || [],
                hacer: hacer || [],
                verificar: verificar || [],
                actuar: actuar || [],
                resources: resources || [],
                indicators: indicators || [],
                documents: documents || [],
                risks: risks || [],
            }
        });

        return NextResponse.json(characterization);

    } catch (error: any) {
        console.error('Error saving characterization:', error);
        return NextResponse.json({ 
            error: 'Error al guardar la caracterización',
            details: error.message 
        }, { status: 500 });
    }
}
