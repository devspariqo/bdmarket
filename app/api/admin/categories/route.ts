import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { slugify } from '@/lib/utils';

/** GET /api/admin/categories — full tree (flat list with parent refs). */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true, children: true } } },
  });
  return NextResponse.json({ categories });
}

/** POST /api/admin/categories — create or update (upsert semantics via optional id). */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const data = {
    name: String(body.name),
    nameBn: body.nameBn || null,
    slug: body.slug ? slugify(body.slug) : slugify(body.name),
    description: body.description || null,
    image: body.image || null,
    icon: body.icon || null,
    parentId: body.parentId || null,
    position: Number(body.position || 0),
    featured: !!body.featured,
    status: body.status || 'active',
    metaTitle: body.metaTitle || null,
    metaDesc: body.metaDesc || null,
  };

  try {
    if (body.id) {
      const category = await prisma.category.update({ where: { id: body.id }, data });
      return NextResponse.json({ ok: true, category });
    }
    const category = await prisma.category.create({ data });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'category.create', entity: 'Category', entityId: category.id },
    });
    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      return NextResponse.json({ error: 'A category with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to save category' }, { status: 500 });
  }
}

/** DELETE /api/admin/categories?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    return NextResponse.json(
      { error: `This category has ${childCount} sub-categories. Move or delete them first.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: session.id, action: 'category.delete', entity: 'Category', entityId: id },
  });
  return NextResponse.json({ ok: true });
}
