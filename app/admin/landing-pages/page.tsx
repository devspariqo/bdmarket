import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { landingPath } from '@/lib/landing-blocks';
import LandingPageList, { type LandingRow } from '@/components/admin/LandingPageList';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Landing Pages' };

/**
 * Landing pages, with the two numbers that make them worth having.
 *
 * Orders and revenue are grouped in a single query rather than one per page, so
 * the list stays one round trip however many funnels the merchant builds.
 */
export default async function AdminLandingPagesPage() {
  const [pages, grouped, config] = await Promise.all([
    prisma.landingPage.findMany({ orderBy: { updatedAt: 'desc' } }),
    // Cancelled orders are excluded from the revenue figure; counting them would
    // overstate what the funnel actually earned.
    prisma.order
      .groupBy({
        by: ['landingPageId'],
        where: { landingPageId: { not: null }, status: { not: 'CANCELLED' } },
        _count: { _all: true },
        _sum: { total: true },
      })
      .catch(() => []),
    getSiteConfig(),
  ]);

  const stats = new Map<string, { orders: number; revenue: number }>();
  for (const g of grouped as any[]) {
    if (!g.landingPageId) continue;
    stats.set(g.landingPageId, {
      orders: g._count?._all ?? 0,
      revenue: Math.round(g._sum?.total ?? 0),
    });
  }

  const rows: LandingRow[] = pages.map((p) => {
    const s = stats.get(p.id);
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      parentSlug: p.parentSlug,
      status: p.status,
      views: p.views,
      orders: s?.orders ?? 0,
      revenue: s?.revenue ?? 0,
      updated: p.updatedAt.toISOString(),
      path: landingPath(p.parentSlug, p.slug),
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Growth</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Landing Pages
        </h1>
        <p className="mt-1 max-w-2xl text-[15px] text-ink-500">
          Standalone product pages with no menu and no footer, built for paid traffic. Each one has
          its own order form, its own tracking and its own URL under{' '}
          <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-[13px]">
            {config.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}/collection/…
          </code>
        </p>
      </header>

      <LandingPageList initial={rows} />

      <p className="text-[13px] text-ink-500">
        Need the order emails and SMS to work? Set them up under{' '}
        <Link href="/admin/settings/email" className="font-semibold text-brand-700 hover:underline">
          Settings → Email
        </Link>{' '}
        and{' '}
        <Link href="/admin/settings/sms" className="font-semibold text-brand-700 hover:underline">
          Settings → SMS
        </Link>
        . Landing-page orders use the same notification path as the cart checkout.
      </p>
    </div>
  );
}
