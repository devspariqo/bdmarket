import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'All Brands',
  description: 'Browse all Bangladeshi fashion brands available at BD Market — Aarong, Yellow, Sailor, Dorjibari and more.',
  alternates: { canonical: '/brands' },
};

export const revalidate = 300;

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { status: 'active' },
    orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="container-x py-10">
      <nav className="mb-3 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
        <span className="font-semibold text-ink-800">Brands</span>
      </nav>
      <h1 className="font-display text-3xl font-bold text-ink-900">Shop by Brand</h1>
      <p className="mt-2 max-w-2xl text-[15px] text-ink-500">
        We partner with Bangladesh's most trusted fashion houses and lifestyle labels.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brand/${b.slug}`}
            className="group flex items-start gap-4 rounded-2xl border border-ink-200 bg-white p-5 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 font-display text-xl font-bold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
              {b.name.charAt(0)}
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink-900 group-hover:text-brand-700">{b.name}</h2>
              {b.country && <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">{b.country}</p>}
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
                {b.description || `${b.name} products available online in Bangladesh.`}
              </p>
              <p className="mt-2 text-[12px] font-bold text-brand-700">{b._count.products} products →</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
