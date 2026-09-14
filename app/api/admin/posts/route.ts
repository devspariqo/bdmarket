import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { slugify } from '@/lib/utils';

/** POST /api/admin/posts — create or update a blog post. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const content = String(body.content || '');
  // Rough estimate: ~200 words per minute
  const words = content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(words / 200));

  const data = {
    title: String(body.title),
    slug: body.slug ? slugify(body.slug) : slugify(body.title),
    excerpt: body.excerpt || null,
    content,
    coverImage: body.coverImage || null,
    category: body.category || 'Fashion',
    tags: body.tags || null,
    authorName: body.authorName || 'BD Market Team',
    status: body.status || 'published',
    featured: !!body.featured,
    readMinutes,
    metaTitle: body.metaTitle || null,
    metaDesc: body.metaDesc || null,
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
  };

  try {
    if (body.id) {
      const post = await prisma.post.update({ where: { id: body.id }, data });
      return NextResponse.json({ ok: true, post });
    }
    const post = await prisma.post.create({ data });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'post.create', entity: 'Post', entityId: post.id },
    });
    return NextResponse.json({ ok: true, post });
  } catch (e: any) {
    if (String(e?.code) === 'P2002') {
      return NextResponse.json({ error: 'A post with that slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: e?.message || 'Failed to save post' }, { status: 500 });
  }
}

/** DELETE /api/admin/posts?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
