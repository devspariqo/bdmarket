import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { parseBlocks } from '@/lib/landing-blocks';

export const dynamic = 'force-dynamic';

/**
 * Admin CRUD for landing pages.
 *
 * POST creates or updates a whole page (the builder saves the entire block tree
 * at once — a per-block endpoint would need its own conflict handling for two
 * tabs editing the same page). PATCH changes only status, which is what the list
 * page's publish toggle needs. DELETE removes the page.
 *
 * Orders are never deleted with the page: `Order.landingPageId` is `SetNull`, so
 * removing a funnel keeps its orders and loses only the attribution.
 */

/** URL-safe slug from a title, or a random suffix if the title has no latin text. */
function slugify(input: string): string {
  const base = String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `page-${Math.random().toString(36).slice(2, 8)}`;
}

/** Keep a slug unique without failing on the constraint. `exceptId` allows a
 *  page to keep its own slug while being edited. */
async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  let candidate = base;
  for (let i = 0; i < 40; i++) {
    const clash = await prisma.landingPage.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash || clash.id === exceptId) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  /**
   * Duplicate an existing page.
   *
   * Copied server-side rather than by round-tripping the block tree through the
   * browser: the tree can be large, and the copy must not depend on the client
   * having an up-to-date version of it.
   */
  if (body.duplicateOf) {
    const src = await prisma.landingPage.findUnique({ where: { id: String(body.duplicateOf) } });
    if (!src) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    const { id, createdAt, updatedAt, views, ...rest } = src;
    const slug = await uniqueSlug(`${src.slug}-copy`);
    const page = await prisma.landingPage.create({
      data: {
        ...rest,
        slug,
        title: `${src.title} (copy)`,
        // A copy starts as a draft: publishing it by accident would put two
        // near-identical pages live and split the ad spend.
        status: 'draft',
      },
    });
    return NextResponse.json({ ok: true, page });
  }

  const title = String(body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 });

  // Parent becomes a path segment, so it must be a single clean slug.
  const parentSlug = slugify(String(body.parentSlug || 'collection').trim() || 'collection');

  const data = {
    title,
    parentSlug,
    status: body.status === 'published' ? 'published' : 'draft',
    blocks: JSON.stringify(parseBlocks(body.blocks)),
    metaTitle: body.metaTitle || null,
    metaDesc: body.metaDesc || null,
    metaKeywords: body.metaKeywords || null,
    ogImage: body.ogImage || null,
    canonical: body.canonical || null,
    noIndex: !!body.noIndex,
    gaId: body.gaId || null,
    fbPixelId: body.fbPixelId || null,
    customHead: body.customHead || null,
    customBody: body.customBody || null,
    bgColor: body.bgColor || null,
    textColor: body.textColor || null,
    fontFamily: body.fontFamily || null,
    maxWidth: Number(body.maxWidth) || 1100,
    checkoutEnabled: body.checkoutEnabled !== false,
    checkoutHeading: body.checkoutHeading || null,
    checkoutButton: body.checkoutButton || null,
    thankYouNote: body.thankYouNote || null,
  };

  try {
    if (body.id) {
      const slug = await uniqueSlug(slugify(String(body.slug || title)), String(body.id));
      const page = await prisma.landingPage.update({
        where: { id: String(body.id) },
        data: { ...data, slug },
      });
      return NextResponse.json({ ok: true, page });
    }

    const slug = await uniqueSlug(slugify(String(body.slug || title)));
    const page = await prisma.landingPage.create({ data: { ...data, slug } });
    return NextResponse.json({ ok: true, page });
  } catch (err: any) {
    console.error('[landing-pages] save failed:', err?.message || err);
    return NextResponse.json({ error: 'Could not save the page. Please try again.' }, { status: 500 });
  }
}

/** Status only — used by the publish/unpublish toggle in the list. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || '');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const status = body.status === 'published' ? 'published' : 'draft';

  try {
    const page = await prisma.landingPage.update({ where: { id }, data: { status } });
    return NextResponse.json({ ok: true, page });
  } catch {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    // Orders survive: Order.landingPageId is SetNull on delete.
    await prisma.landingPage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }
}
