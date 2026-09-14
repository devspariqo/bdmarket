import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { slugify } from '@/lib/utils';

/** POST /api/admin/pages — create or update a CMS page. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const data = {
    title: String(body.title),
    titleBn: body.titleBn || null,
    slug: body.slug ? slugify(body.slug) : slugify(body.title),
    content: body.content || '',
    excerpt: body.excerpt || null,
    template: body.template || 'default',
    status: body.status || 'published',
    showInMenu: !!body.showInMenu,
    menuOrder: Number(body.menuOrder || 0),
    featuredImage: body.featuredImage || null,
    metaTitle: body.metaTitle || null,
    metaDesc: body.metaDesc || null,
    metaKeywords: body.metaKeywords || null,
  };

  try {
    if (body.id) {
      const page = await prisma.page.update({ where: { id: body.id }, data });
      return NextResponse.json({ ok: true, page });
    }
    const page = await prisma.page.create({ data });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'page.create', entity: 'Page', entityId: page.id },
    });
    return NextResponse.json({ ok: true, page });
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      return NextResponse.json({ error: 'A page with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to save page' }, { status: 500 });
  }
}

/** DELETE /api/admin/pages?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.page.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
