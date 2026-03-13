import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullname, company, email, password } = body;

    if (!fullname || !company || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Crear Tenant y Usuario en una transacción
    // El slug se genera a partir del nombre de la empresa
    const slug = company.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear el Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: company,
          slug: `${slug}-${Math.floor(Math.random() * 1000)}`, // Evitar colisiones de slug
          plan: 'BASICO',
        },
      });

      // 2. Crear el Usuario administrador vinculado al Tenant
      const user = await tx.user.create({
        data: {
          name: fullname,
          email: email,
          password: password, // Almacenado temporalmente en texto plano (se recomienda hashear)
          role: 'ADMIN_EMPRESA',
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      { message: 'Registro exitoso', tenantId: result.tenant.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar el registro' },
      { status: 500 }
    );
  }
}
