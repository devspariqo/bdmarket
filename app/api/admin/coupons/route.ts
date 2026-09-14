import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** POST /api/admin/coupons — create or update. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });

  const data = {
    code: String(body.code).toUpperCase().trim(),
    description: body.description || null,
    type: body.type || 'percent',
    value: Number(body.value || 0),
    minOrder: Number(body.minOrder || 0),
    maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
    usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
    perCustomer: Number(body.perCustomer || 1),
    appliesTo: body.appliesTo || 'all',
    targetIds: body.targetIds || null,
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    status: body.status || 'active',
  };

  try {
    if (body.id) {
      const coupon = await prisma.coupon.update({ where: { id: body.id }, data });
      return NextResponse.json({ ok: true, coupon });
    }
    const coupon = await prisma.coupon.create({ data });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'coupon.create', entity: 'Coupon', entityId: coupon.id },
    });
    return NextResponse.json({ ok: true, coupon });
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      return NextResponse.json({ error: 'That coupon code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to save coupon' }, { status: 500 });
  }
}

/** DELETE /api/admin/coupons?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
