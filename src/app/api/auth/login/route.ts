import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth-session';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingrese un correo válido.').max(254),
  password: z.string().min(1, 'La contraseña es obligatoria.').max(72, 'La contraseña excede el límite permitido.')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña excede el límite permitido.'),
  remember: z.boolean('La opción de mantener sesión debe ser verdadera o falsa.').optional().default(false),
});

const invalidCredentials = () => NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { email, password, remember } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email }, include: { tenant: true } });
    if (!user?.password) return invalidCredentials();

    // Un valor con prefijo bcrypt solo se verifica como hash, nunca como contraseña literal.
    const isBcrypt = /^\$2/.test(user.password);
    let passwordMatches = false;
    if (isBcrypt) {
      try { passwordMatches = await bcrypt.compare(password, user.password); }
      catch { return invalidCredentials(); }
    } else {
      const supplied = Buffer.from(password, 'utf8');
      const stored = Buffer.from(user.password, 'utf8');
      passwordMatches = supplied.length === stored.length && timingSafeEqual(supplied, stored);
    }
    if (!passwordMatches) return invalidCredentials();
    if (!user.active || !user.tenant.active) {
      return NextResponse.json({ error: 'La cuenta o la empresa está inactiva. Contacte al administrador.' }, { status: 403 });
    }

    if (!isBcrypt) {
      // Migrar el valor legado únicamente después de verificar credenciales y estado.
      const upgraded = await prisma.user.updateMany({
        where: { id: user.id, password: user.password, active: true, tenant: { active: true } },
        data: { password: await bcrypt.hash(password, 10) },
      });
      if (upgraded.count !== 1) {
        return NextResponse.json({ error: 'La cuenta cambió durante el acceso. Intente iniciar sesión nuevamente.' }, { status: 409 });
      }
    }

    const safeUser = {
      id: user.id, tenantId: user.tenantId, email: user.email, name: user.name,
      position: user.position, role: user.role, topManagement: user.topManagement, avatar: user.avatar, active: user.active,
      createdAt: user.createdAt, updatedAt: user.updatedAt, phone: user.phone, tenant: user.tenant,
    };
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
    const response = NextResponse.json({ user: safeUser, tenant: user.tenant });
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user.id, maxAge), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge,
    });
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'La solicitud no contiene JSON válido.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'No fue posible iniciar sesión.' }, { status: 500 });
  }
}
