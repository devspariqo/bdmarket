import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { slugify } from '@/lib/utils';

/** GET /api/admin/brands */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ brands });
}

/** POST /api/admin/brands — create (no id) or update (with id). */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const data = {
    name: String(body.name),
    slug: body.slug ? slugify(body.slug) : slugify(body.name),
    logo: body.logo || null,
    description: body.description || null,
    country: body.country || 'Bangladesh',
    featured: !!body.featured,
    status: body.status || 'active',
  };

  try {
    if (body.id) {
      const brand = await prisma.brand.update({ where: { id: body.id }, data });
      return NextResponse.json({ ok: true, brand });
    }
    const brand = await prisma.brand.create({ data });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'brand.create', entity: 'Brand', entityId: brand.id },
    });
    return NextResponse.json({ ok: true, brand });
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      return NextResponse.json({ error: 'A brand with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to save brand' }, { status: 500 });
  }
}

/** DELETE /api/admin/brands?id=xxx — detaches products before deleting. */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
  await prisma.brand.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: session.id, action: 'brand.delete', entity: 'Brand', entityId: id },
  });
  return NextResponse.json({ ok: true });
}
