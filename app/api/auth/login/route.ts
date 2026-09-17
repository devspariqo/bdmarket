import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';
import { getAdminBase } from '@/lib/admin-path';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (!['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role)) {
      return NextResponse.json({ error: 'This account does not have admin access' }, { status: 403 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role as any });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', entity: 'auth', ip: req.headers.get('x-forwarded-for') || 'local' },
    });

    /**
     * The redirect target is the configured panel path, not `/admin`.
     *
     * The form currently navigates from the `base` prop it was given, so this
     * value is not what moves the browser — but returning a hardcoded `/admin`
     * means any future caller that trusts it sends the merchant to a 404 the
     * moment they have moved the panel.
     */
    return NextResponse.json({ ok: true, redirect: await getAdminBase(), role: user.role });
  } catch (e) {
    console.error('admin login', e);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
