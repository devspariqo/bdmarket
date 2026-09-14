import type { Metadata } from 'next';
import prisma from '@/lib/db';
import BannerManager from '@/components/admin/BannerManager';

export const metadata: Metadata = { title: 'Banners' };
export const dynamic = 'force-dynamic';

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: 'asc' }, { position_order: 'asc' }],
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Banners</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Homepage hero slides, promo tiles and announcement strips. Ordering is controlled by the position value —
          lower numbers appear first.
        </p>
      </header>

      <BannerManager
        banners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          ctaLabel: b.ctaLabel,
          ctaHref: b.ctaHref,
          position: b.position,
          bgColor: b.bgColor,
          textColor: b.textColor,
          position_order: b.position_order,
          status: b.status,
        }))}
      />
    </div>
  );
}
