import { createHmac, timingSafeEqual } from 'node:crypto';
import prisma from '@/lib/db';

export const SESSION_COOKIE_NAME = 'sgc_session';

interface SessionPayload {
  userId: string;
  expiresAt: number;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET || process.env.DATABASE_URL;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET, SESSION_SECRET o DATABASE_URL debe estar configurado.');
  }

  return secret || 'sgc-local-development-session-secret';
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getSessionSecret()).update(encodedPayload).digest('base64url');
}

export function createSessionToken(userId: string, maxAgeSeconds: number) {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = cookie.trim().split('=');
    if (rawName === name) {
      try { return decodeURIComponent(rawValue.join('=')); } catch { return null; }
    }
  }

  return null;
}

export function verifySessionToken(token: string | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  const [encodedPayload, providedSignature] = parts;
  if (parts.length !== 2 || !encodedPayload || !providedSignature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.userId !== 'string' || !payload.userId ||
        !Number.isFinite(payload.expiresAt) || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(request: Request) {
  const session = verifySessionToken(readCookie(request, SESSION_COOKIE_NAME));
  if (!session) return null;

  return prisma.user.findFirst({
    where: { id: session.userId, active: true, tenant: { active: true } },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      role: true,
      topManagement: true,
    },
  });
}

export function canApprovePolicies(role: string) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_EMPRESA';
}

export function canApproveDocuments(role: string) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN_EMPRESA';
}

export function canAccessTenant(role: string, userTenantId: string, tenantId: string) {
  return role === 'SUPER_ADMIN' || userTenantId === tenantId;
}
