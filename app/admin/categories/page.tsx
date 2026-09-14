import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowUp, FolderTree, Package, Plus } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import CategoryManager from '@/components/admin/CategoryManager';

export const metadata: Metadata = { title: 'Categories' };
export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true, children: true } } },
  });

  const roots = categories.filter((c) => !c.parentId);
  const totalProducts = categories.reduce((s, c) => s + c._count.products, 0);
  const featured = categories.filter((c) => c.featured).length;
  const withImage = categories.filter((c) => !!c.image).length;

  const stats = [
    { label: 'Total categories', value: formatNumber(categories.length), icon: FolderTree, tone: 'bg-brand-50 text-brand-700' },
    { label: 'Top-level', value: formatNumber(roots.length), icon: ArrowUp, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Sub-categories', value: formatNumber(categories.length - roots.length), icon: ArrowDown, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Products mapped', value: formatNumber(totalProducts), icon: Package, tone: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Categories
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Organise your catalogue into a browsable tree. Drag order is controlled by the position value.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-ink-500">
          <span className="badge border border-brand-200 bg-brand-50 text-brand-700">{featured} featured</span>
          <span className="badge border border-ink-200 bg-white text-ink-600">{withImage} with images</span>
        </div>
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

      <CategoryManager
        initial={categories.map((c) => ({
          id: c.id,
          name: c.name,
          nameBn: c.nameBn,
          slug: c.slug,
          description: c.description,
          image: c.image,
          parentId: c.parentId,
          position: c.position,
          featured: c.featured,
          status: c.status,
          metaTitle: c.metaTitle,
          metaDesc: c.metaDesc,
          productCount: c._count.products,
        }))}
      />
    </div>
  );
}
