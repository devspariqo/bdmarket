import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Boxes, PackageX, Wallet } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber, formatPrice, parseJSON } from '@/lib/utils';
import InventoryTable from '@/components/admin/InventoryTable';

export const metadata: Metadata = { title: 'Inventory' };
export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: { filter?: string; q?: string };
}) {
  const filter = searchParams.filter || 'all';
  const q = searchParams.q?.trim() || '';

  const where: any = {};
  if (filter === 'low') where.stock = { lte: 10, gt: 0 };
  if (filter === 'out') where.stock = { lte: 0 };
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];

  const [products, all] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, sku: true, stock: true, lowStockAlert: true,
        price: true, costPrice: true, images: true, status: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
      take: 200,
    }),
    prisma.product.findMany({ select: { stock: true, price: true, costPrice: true } }),
  ]);

  const outOfStock = all.filter((p) => p.stock <= 0).length;
  const lowStock = all.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const totalUnits = all.reduce((s, p) => s + p.stock, 0);
  const stockValue = all.reduce((s, p) => s + p.stock * (p.costPrice || p.price), 0);

  const tabs = [
    { key: 'all', label: 'All products', count: all.length },
    { key: 'low', label: 'Low stock', count: lowStock },
    { key: 'out', label: 'Out of stock', count: outOfStock },
  ];

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Inventory</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Track stock levels across the whole catalogue and update them inline — no need to open each product.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Units in stock" value={formatNumber(totalUnits)} icon={Boxes} tone="bg-brand-50 text-brand-700" />
        <Stat label="Low stock" value={formatNumber(lowStock)} icon={AlertTriangle} tone="bg-amber-50 text-amber-700" />
        <Stat label="Out of stock" value={formatNumber(outOfStock)} icon={PackageX} tone="bg-rose-50 text-rose-600" />
        <Stat label="Stock value (cost)" value={formatPrice(stockValue)} icon={Wallet} tone="bg-blue-50 text-blue-700" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-x flex gap-1.5 pb-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/inventory?filter=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`chip whitespace-nowrap ${filter === t.key ? 'chip-active' : ''}`}
            >
              {t.label}
              <span className="rounded-full bg-black/10 px-1.5 text-[12px]">{t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <InventoryTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          lowStockAlert: p.lowStockAlert,
          price: p.price,
          costPrice: p.costPrice ?? 0,
          image: (parseJSON<string[]>(p.images, []) || [])[0] || '',
          status: p.status,
          category: p.category?.name || '—',
        }))}
      />
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 truncate font-display text-xl font-bold text-ink-900">{value}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
