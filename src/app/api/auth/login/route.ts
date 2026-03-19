import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;
    const email = body.email?.toLowerCase().trim();

    console.log('Intento de login para:', email);

    if (!email || !password) {
      return NextResponse.json(
        { error: 'El correo y la contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      console.log('Usuario no encontrado:', email);
      return NextResponse.json(
        { error: 'El correo electrónico no está registrado' },
        { status: 401 }
      );
    }

    console.log('Usuario encontrado, validando contraseña...');

    // Validar contraseña usando bcrypt (antes era texto plano)
    const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;

    if (!isPasswordValid) {
      console.log('Contraseña incorrecta para:', email);
      // DEBUG: Comentar en producción si es sensible, pero ayuda a diagnosticar
      // console.log('Password provided:', password);
      // console.log('Hash in DB:', user.password);
      return NextResponse.json(
        { error: 'La contraseña es incorrecta' },
        { status: 401 }
      );
    }


    // Validar que el usuario esté activo
    if (!user.active) {
      return NextResponse.json(
        { error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // Retornar datos del usuario y tenant (sin contraseña)
    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      tenant: user.tenant,
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
