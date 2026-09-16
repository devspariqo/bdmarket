import { NextResponse } from 'next/server';
import { requireAdmin, hashPassword } from '@/lib/auth';
import prisma from '@/lib/db';

/** POST /api/admin/users — create or update an admin/manager/editor account. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const email = String(body.email).toLowerCase().trim();
  const data: Record<string, any> = {
    name: String(body.name),
    email,
    phone: body.phone || null,
    role: body.role || 'EDITOR',
    status: body.status || 'active',
    // The column existed and the list rendered it, but nothing ever wrote to it.
    avatar: body.avatar || null,
  };
  if (body.password) data.passwordHash = await hashPassword(String(body.password));

  try {
    if (body.id) {
      const user = await prisma.user.update({
        where: { id: body.id },
        data,
        select: { id: true, name: true, email: true, role: true, status: true, avatar: true, createdAt: true },
      });
      return NextResponse.json({ ok: true, user });
    }

    if (!body.password) {
      return NextResponse.json({ error: 'Password is required for new users' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: data as any,
      select: { id: true, name: true, email: true, role: true, status: true, avatar: true, createdAt: true },
    });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'user.create', entity: 'User', entityId: user.id },
    });
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      return NextResponse.json({ error: 'That email is already registered' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to save user' }, { status: 500 });
  }
}

/** PATCH /api/admin/users — enable/disable an account. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  const { id, status } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (id === session.id) {
    return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: status || 'active' },
    select: { id: true, name: true, email: true, role: true, status: true, avatar: true },
  });
  return NextResponse.json({ ok: true, user });
}

/** DELETE /api/admin/users?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (id === session.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  const remainingAdmins = await prisma.user.count({ where: { role: 'ADMIN', id: { not: id } } });
  const target = await prisma.user.findUnique({ where: { id } });
  if (target?.role === 'ADMIN' && remainingAdmins === 0) {
    return NextResponse.json({ error: 'Cannot delete the last remaining admin' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
