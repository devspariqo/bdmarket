import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from './db';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'bd-market-dev-secret-change-me-in-production'
);

const COOKIE = 'bdm_session';
const CUSTOMER_COOKIE = 'bdm_customer';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'EDITOR' | 'CUSTOMER';
};

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const s = await getSession();
  if (!s) return null;
  if (!['ADMIN', 'MANAGER', 'EDITOR'].includes(s.role)) return null;
  return s;
}

export async function requireRole(roles: SessionUser['role'][]): Promise<SessionUser | null> {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) return null;
  return s;
}

export function destroySession() {
  cookies().delete(COOKIE);
}

// ─── Customer (storefront) session — separate from admin ───

export async function createCustomerSession(id: string, email: string, name: string) {
  const token = await new SignJWT({ id, email, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
  cookies().set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCustomerSession(): Promise<{ id: string; email: string; name: string } | null> {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as any;
  } catch {
    return null;
  }
}

export function destroyCustomerSession() {
  cookies().delete(CUSTOMER_COOKIE);
}

// ─── API token (for REST endpoints) ───

export async function verifyApiKey(req: Request) {
  const key = req.headers.get('x-api-key');
  const expected = process.env.API_KEY || 'bdm-api-dev-key';
  return key === expected;
}
