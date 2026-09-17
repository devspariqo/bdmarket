import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Filter, Download, Edit, Trash2, Eye, PackageX } from 'lucide-react';
import prisma from '@/lib/db';
import { formatPrice, formatDate, parseJSON, cn } from '@/lib/utils';
import ProductRowActions from '@/components/admin/ProductRowActions';
import { getAdminBase } from '@/lib/admin-path';

export const metadata: Metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; category?: string; page?: string; stock?: string };
}) {
  const base = await getAdminBase();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = 20;
  const q = searchParams.q?.trim();
  const status = searchParams.status;
  const categoryId = searchParams.category;

  const where: any = {};
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }, { tags: { contains: q } }];
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (searchParams.stock === 'low') where.stock = { gt: 0, lte: 5 };
  if (searchParams.stock === 'out') where.stock = { lte: 0 };

  const [products, total, categories, counts] = await Promise.all([
    prisma.product.findMany({
      where, orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage, take: perPage,
      include: { category: { select: { name: true } }, brand: { select: { name: true } } },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true } }),
    prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const allCount = counts.reduce((s, c) => s + c._count._all, 0);

  function pageHref(n: number) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (status) sp.set('status', status);
    if (categoryId) sp.set('category', categoryId);
    if (searchParams.stock) sp.set('stock', searchParams.stock);
    sp.set('page', String(n));
    return `/admin/products?${sp.toString()}`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Products</h1>
          <p className="mt-1 text-[15px] text-ink-500">{total} of {allCount} products</p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/api/admin/products/export" className="btn-outline btn-sm">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Link>
          <Link href={`${base}/products/new`} className="btn-primary btn-sm">
            <Plus className="h-3.5 w-3.5" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="q" className="label">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input id="q" name="q" defaultValue={q} placeholder="Product name, SKU, tag…" className="input py-2 pl-9 text-[13px]" />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="label">Status</label>
            <select id="status" name="status" defaultValue={status || ''} className="select py-2 text-[13px]">
              <option value="">All ({allCount})</option>
              <option value="published">Published ({countMap.published || 0})</option>
              <option value="draft">Draft ({countMap.draft || 0})</option>
              <option value="archived">Archived ({countMap.archived || 0})</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select id="category" name="category" defaultValue={categoryId || ''} className="select py-2 text-[13px]">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="stock" className="label">Stock</label>
            <select id="stock" name="stock" defaultValue={searchParams.stock || ''} className="select py-2 text-[13px]">
              <option value="">Any</option>
              <option value="low">Low Stock (≤5)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <button type="submit" className="btn-dark btn-sm"><Filter className="h-3.5 w-3.5" /> Filter</button>
          <Link href={`${base}/products`} className="btn-ghost btn-sm">Reset</Link>
        </form>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-ink-100 bg-ink-50/60">
            <tr>
              <th className="th w-10">
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" aria-label="Select all" />
              </th>
              <th className="th">Product</th>
              <th className="th">SKU</th>
              <th className="th">Category</th>
              <th className="th">Price</th>
              <th className="th">Stock</th>
              <th className="th">Status</th>
              <th className="th">Sales</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {products.map((p) => {
              const img = parseJSON<string[]>(p.images, [])[0];
              return (
                <tr key={p.id} className="transition hover:bg-ink-50/50">
                  <td className="td">
                    <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" aria-label={`Select ${p.name}`} />
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-ink-300"><PackageX className="h-4 w-4" /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`${base}/products/${p.id}`} className="line-clamp-1 text-[13px] font-semibold text-ink-900 hover:text-brand-700">
                          {p.name}
                        </Link>
                        {p.brand && <p className="mt-0.5 text-[12px] text-ink-400">{p.brand.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="td font-mono text-[12px] text-ink-500">{p.sku}</td>
                  <td className="td text-[12px] text-ink-600">{p.category?.name || '—'}</td>
                  <td className="td">
                    <p className="text-[13px] font-bold text-ink-900">{formatPrice(p.price)}</p>
                    {p.comparePrice && (
                      <p className="text-[12px] text-ink-400 line-through">{formatPrice(p.comparePrice)}</p>
                    )}
                  </td>
                  <td className="td">
                    <span className={cn(
                      'badge',
                      p.stock <= 0 ? 'bg-rose-100 text-rose-700'
                        : p.stock <= 5 ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-700'
                    )}>
                      {p.stock <= 0 ? 'Out of stock' : `${p.stock} units`}
                    </span>
                  </td>
                  <td className="td">
                    <span className={cn(
                      'badge',
                      p.status === 'published' ? 'bg-emerald-100 text-emerald-700'
                        : p.status === 'draft' ? 'bg-ink-100 text-ink-600'
                        : 'bg-slate-100 text-slate-600'
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="td">
                    <p className="text-[13px] font-semibold text-ink-800">{p.soldCount}</p>
                    <p className="text-[12px] text-ink-400">{p.rating.toFixed(1)}★</p>
                  </td>
                  <td className="td">
                    <ProductRowActions id={p.id} slug={p.slug} name={p.name} status={p.status} base={base} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="py-16 text-center">
            <PackageX className="mx-auto mb-3 h-9 w-9 text-ink-300" />
            <p className="text-[15px] font-semibold text-ink-700">No products found</p>
            <p className="mt-1 text-[13px] text-ink-500">Try changing your filters or add a new product.</p>
            <Link href={`${base}/products/new`} className="btn-primary btn-sm mt-4">Add Product</Link>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-ink-500">
            Page {page} of {totalPages} · showing {products.length} items
          </p>
          <div className="flex gap-1.5">
            {page > 1 && <Link href={pageHref(page - 1)} className="btn-outline btn-sm">← Prev</Link>}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (n > totalPages) return null;
              return (
                <Link
                  key={n} href={pageHref(n)}
                  className={cn(
                    'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-bold transition',
                    n === page ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-white text-ink-700 hover:border-ink-900'
                  )}
                >
                  {n}
                </Link>
              );
            })}
            {page < totalPages && <Link href={pageHref(page + 1)} className="btn-outline btn-sm">Next →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
