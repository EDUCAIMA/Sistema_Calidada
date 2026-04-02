import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tenantId } = await params;
        const { adminPassword, adminEmail } = await request.json();

        if (!tenantId || !adminPassword || !adminEmail) {
            return NextResponse.json(
                { error: 'Información incompleta para la eliminación' },
                { status: 400 }
            );
        }

        // 1. Verificar la contraseña del administrador
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN_EMPRESA')) {
             return NextResponse.json(
                { error: 'No tienes permisos para realizar esta acción' },
                { status: 403 }
            );
        }

        const isPasswordCorrect = await bcrypt.compare(adminPassword, admin.password || '');
        if (!isPasswordCorrect) {
            return NextResponse.json(
                { error: 'Contraseña de administrador incorrecta' },
                { status: 401 }
            );
        }

        // 2. Ejecutar la eliminación en cascada manual dentro de una transacción
        await prisma.$transaction(async (tx) => {
            // ELIMINAR REGISTROS SIGUIENDO EL ORDEN DE DEPENDENCIAS (HIJOS -> PADRES)

            // 1. Auditorías, Hallazgos y Acciones Correctivas
            const audits = await tx.audit.findMany({ where: { tenantId } });
            const auditIds = audits.map(a => a.id);
            const findings = await tx.finding.findMany({ where: { auditId: { in: auditIds } } });
            const findingIds = findings.map(f => f.id);

            await tx.correctiveAction.deleteMany({ where: { findingId: { in: findingIds } } });
            await tx.finding.deleteMany({ where: { auditId: { in: auditIds } } });
            await tx.audit.deleteMany({ where: { tenantId } });

            // 2. Riesgos y Matrices
            await tx.risk.deleteMany({ where: { tenantId } });
            await tx.riskMatrix.deleteMany({ where: { tenantId } });

            // 3. Documentos y Versiones
            const documents = await tx.document.findMany({ where: { tenantId } });
            const docIds = documents.map(d => d.id);
            await tx.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
            await tx.document.deleteMany({ where: { tenantId } });

            // 4. Procesos y Caracterizaciones
            const processes = await tx.process.findMany({ where: { tenantId } });
            const processIds = processes.map(p => p.id);
            await tx.processCharacterization.deleteMany({ where: { processId: { in: processIds } } });
            await tx.process.deleteMany({ where: { tenantId } });

            // 5. Usuarios (Deben borrarse DESPUÉS de los procesos que dependen de ellos por responsableId)
            await tx.user.deleteMany({ where: { tenantId } });

            // 6. Otros (Contexto y Formatos)
            await tx.dOFAItem.deleteMany({ where: { tenantId } });
            await tx.stakeholder.deleteMany({ where: { tenantId } });
            await tx.sGCScope.deleteMany({ where: { tenantId } });
            await tx.formatControl.deleteMany({ where: { tenantId } });

            // 7. Finalmente, el Tenant
            await tx.tenant.delete({
                where: { id: tenantId }
            });
        });

        return NextResponse.json({ message: 'Sistema eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar sistema:', error);
        return NextResponse.json(
            { error: 'Error al procesar la eliminación: ' + error.message },
            { status: 500 }
        );
    }
}
