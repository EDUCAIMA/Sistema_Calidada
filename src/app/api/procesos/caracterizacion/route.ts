import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('--- API CARACTERIZACIÓN [POST] ---');
        console.log('Body recibido:', JSON.stringify(body, null, 2));

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
              ...(objective !== undefined && objective !== null && { objective }),
              ...(scope !== undefined && scope !== null && { scope }),
              ...(responsibleId !== undefined && responsibleId !== null && { responsibleId }),
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
        console.error('CRITICAL_API_ERROR [caracterizacion]:', error);
        return NextResponse.json({ 
            error: 'Error al guardar la caracterización',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
