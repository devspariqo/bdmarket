import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** POST /api/admin/banners — create or update a homepage banner. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.image) {
    return NextResponse.json({ error: 'Title and image are required' }, { status: 400 });
  }

  const data = {
    title: String(body.title),
    subtitle: body.subtitle || null,
    image: String(body.image),
    ctaLabel: body.ctaLabel || null,
    ctaHref: body.ctaHref || null,
    position: body.position || 'hero',
    bgColor: body.bgColor || null,
    textColor: body.textColor || null,
    position_order: Number(body.position_order || 0),
    status: body.status || 'active',
    startsAt: body.startsAt ? new Date(body.startsAt) : null,
    endsAt: body.endsAt ? new Date(body.endsAt) : null,
  };

  if (body.id) {
    const banner = await prisma.banner.update({ where: { id: body.id }, data });
    return NextResponse.json({ ok: true, banner });
  }
  const banner = await prisma.banner.create({ data });
  return NextResponse.json({ ok: true, banner });
}

/** PATCH /api/admin/banners — quick status/sort toggle. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, position_order } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const data: Record<string, any> = {};
  if (status) data.status = status;
  if (position_order !== undefined) data.position_order = Number(position_order);

  const banner = await prisma.banner.update({ where: { id }, data });
  return NextResponse.json({ ok: true, banner });
}

/** DELETE /api/admin/banners?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.banner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
