import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { email, password, name, role, tenantId, position, active } = body;

        const updateData: any = {};
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (tenantId) updateData.tenantId = tenantId;
        if (position !== undefined) updateData.position = position;
        if (active !== undefined) updateData.active = active;
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            include: {
                tenant: true,
            }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: 'Error al actualizar el usuario' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Error al eliminar el usuario' },
            { status: 500 }
        );
    }
}
