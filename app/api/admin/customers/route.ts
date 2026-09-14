import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** PATCH /api/admin/customers — update tags, notes, marketing consent. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, tags, notes, acceptsMarketing, name, phone, district } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const data: Record<string, any> = {};
  if (tags !== undefined) data.tags = tags || null;
  if (notes !== undefined) data.notes = notes || null;
  if (acceptsMarketing !== undefined) data.acceptsMarketing = !!acceptsMarketing;
  if (name) data.name = name;
  if (phone !== undefined) data.phone = phone || null;
  if (district !== undefined) data.district = district || null;

  const customer = await prisma.customer.update({ where: { id }, data });
  return NextResponse.json({ ok: true, customer });
}

/** DELETE /api/admin/customers?id=xxx — ADMIN only. */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete customers' }, { status: 403 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
