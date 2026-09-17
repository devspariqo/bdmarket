import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { getAdminBase } from '@/lib/admin-path';
import { safeFirstImage } from '@/lib/cart';
import { parseBlocks } from '@/lib/landing-blocks';
import LandingBuilder from '@/components/admin/LandingBuilder';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Landing page builder' };

/**
 * The page builder.
 *
 * Products are loaded once, up front, and handed to the builder so the preview
 * and the product picker work without a request per interaction. Only the fields
 * a landing page actually renders are selected — a catalogue of a few hundred
 * products stays a small payload.
 */
export default async function AdminLandingBuilderPage({ params }: { params: { id: string } }) {
  const [page, products, config, base] = await Promise.all([
    prisma.landingPage.findUnique({ where: { id: params.id } }).catch(() => null),
    prisma.product
      .findMany({
        where: { status: 'published' },
        orderBy: { createdAt: 'desc' },
        // Capped so a very large catalogue cannot make the builder slow to open.
        take: 500,
        select: { id: true, name: true, slug: true, price: true, comparePrice: true, images: true, stock: true },
      })
      .catch(() => []),
    getSiteConfig(),
    getAdminBase(),
  ]);

  if (!page) notFound();

  return (
    <div className="space-y-4">
      <header>
        <p className="eyebrow">Growth</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900">
          Landing page builder
        </h1>
      </header>

      <LandingBuilder
        siteUrl={config.siteUrl}
        base={base}
        initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          parentSlug: page.parentSlug,
          status: page.status,
          blocks: parseBlocks(page.blocks),
          metaTitle: page.metaTitle || '',
          metaDesc: page.metaDesc || '',
          metaKeywords: page.metaKeywords || '',
          ogImage: page.ogImage || '',
          canonical: page.canonical || '',
          noIndex: page.noIndex,
          gaId: page.gaId || '',
          fbPixelId: page.fbPixelId || '',
          customHead: page.customHead || '',
          customBody: page.customBody || '',
          bgColor: page.bgColor || '',
          textColor: page.textColor || '',
          fontFamily: page.fontFamily || '',
          maxWidth: page.maxWidth,
          checkoutEnabled: page.checkoutEnabled,
        }}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          comparePrice: p.comparePrice ?? null,
          image: safeFirstImage(p.images),
          stock: p.stock,
        }))}
      />
    </div>
  );
}
