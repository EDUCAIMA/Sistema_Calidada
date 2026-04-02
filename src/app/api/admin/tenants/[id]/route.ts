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
            // Eliminar registros dependientes (manual ya que no hay cascade en schema)
            
            // 1. Usuarios vinculados
            await tx.user.deleteMany({ where: { tenantId } });
            
            // 2. Procesos y sus caracterizaciones
            const processes = await tx.process.findMany({ where: { tenantId } });
            const processIds = processes.map(p => p.id);
            await tx.processCharacterization.deleteMany({ where: { processId: { in: processIds } } });
            await tx.process.deleteMany({ where: { tenantId } });

            // 3. Documentos y versiones
            const documents = await tx.document.findMany({ where: { tenantId } });
            const docIds = documents.map(d => d.id);
            await tx.documentVersion.deleteMany({ where: { documentId: { in: docIds } } });
            await tx.document.deleteMany({ where: { tenantId } });

            // 4. Riesgos y Matrices
            await tx.risk.deleteMany({ where: { tenantId } });
            await tx.riskMatrix.deleteMany({ where: { tenantId } });

            // 5. Auditorías y Hallazgos
            const audits = await tx.audit.findMany({ where: { tenantId } });
            const auditIds = audits.map(a => a.id);
            await tx.finding.deleteMany({ where: { auditId: { in: auditIds } } });
            await tx.audit.deleteMany({ where: { tenantId } });

            // 6. Contexto (DOFA, Stakeholders, Scope)
            await tx.dOFAItem.deleteMany({ where: { tenantId } });
            await tx.stakeholder.deleteMany({ where: { tenantId } });
            await tx.sGCScope.deleteMany({ where: { tenantId } });
            
            // 7. Formatos
            await tx.formatControl.deleteMany({ where: { tenantId } });

            // 8. Finalmente, el Tenant
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
