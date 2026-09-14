import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * POST /api/admin/menus
 * Body: { id?, name, location, items: [{label, labelBn, href, children?}], status }
 * `items` is persisted as a JSON string.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.location) {
    return NextResponse.json({ error: 'Name and location are required' }, { status: 400 });
  }

  const data = {
    name: String(body.name),
    location: String(body.location),
    items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items || []),
    status: body.status || 'active',
  };

  try {
    if (body.id) {
      const menu = await prisma.menu.update({ where: { id: body.id }, data });
      return NextResponse.json({ ok: true, menu });
    }
    const menu = await prisma.menu.upsert({
      where: { location: data.location },
      update: data,
      create: data,
    });
    return NextResponse.json({ ok: true, menu });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save menu' }, { status: 500 });
  }
}

/** DELETE /api/admin/menus?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.menu.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
