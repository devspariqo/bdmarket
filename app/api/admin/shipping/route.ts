import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** POST /api/admin/shipping — create or update a shipping zone. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'Zone name is required' }, { status: 400 });

  const data = {
    name: String(body.name),
    districts: body.districts || 'ALL',
    method: body.method || 'flat',
    rate: Number(body.rate || 0),
    freeOver: body.freeOver ? Number(body.freeOver) : null,
    minDays: Number(body.minDays || 2),
    maxDays: Number(body.maxDays || 5),
    codEnabled: body.codEnabled !== false,
    status: body.status || 'active',
    position: Number(body.position || 0),
  };

  if (body.id) {
    const zone = await prisma.shippingZone.update({ where: { id: body.id }, data });
    return NextResponse.json({ ok: true, zone });
  }
  const zone = await prisma.shippingZone.create({ data });
  return NextResponse.json({ ok: true, zone });
}

/** DELETE /api/admin/shipping?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.shippingZone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
