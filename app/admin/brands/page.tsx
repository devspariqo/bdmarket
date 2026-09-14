import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, Package, Sparkles, Store } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import BrandManager from '@/components/admin/BrandManager';

export const metadata: Metadata = { title: 'Brands' };
export const dynamic = 'force-dynamic';

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  const stats = [
    { label: 'Total brands', value: formatNumber(brands.length), icon: Award, tone: 'bg-brand-50 text-brand-700' },
    { label: 'Featured', value: formatNumber(brands.filter((b) => b.featured).length), icon: Sparkles, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Active', value: formatNumber(brands.filter((b) => b.status === 'active').length), icon: Store, tone: 'bg-emerald-50 text-emerald-700' },
    {
      label: 'Products covered',
      value: formatNumber(brands.reduce((s, b) => s + b._count.products, 0)),
      icon: Package,
      tone: 'bg-blue-50 text-blue-700',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Brands</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Manage the labels and labels stocked by your store — Aarong, Yellow, Sailor and more.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">{s.label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink-900">{s.value}</p>
              </div>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <BrandManager
        initial={brands.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logo: b.logo,
          description: b.description,
          country: b.country,
          featured: b.featured,
          status: b.status,
          productCount: b._count.products,
        }))}
      />
    </div>
  );
}
