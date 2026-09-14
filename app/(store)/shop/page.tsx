import { SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import ProductCard from '@/components/store/ProductCard';
import ShopFilters from '@/components/store/ShopFilters';
import { formatNumber } from '@/lib/utils';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

type SP = { [k: string]: string | string[] | undefined };

function p(sp: SP, k: string): string {
  const v = sp[k];
  return Array.isArray(v) ? v[0] || '' : v || '';
}

export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  const config = await getSiteConfig();
  const cat = p(searchParams, 'category');
  const q = p(searchParams, 'q');
  const title = q ? `Search: ${q}` : cat ? `${cap(cat)} Collection` : 'Shop All Products';
  return {
    title,
    description: `Browse ${title.toLowerCase()} at ${config.siteName}. ${config.seo.defaultDesc}`,
    alternates: { canonical: '/shop' },
    robots: { index: !q, follow: true },
  };
}

function cap(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const config = await getSiteConfig();
  const page = Math.max(1, Number(p(searchParams, 'page')) || 1);
  const perPage = config.appearance.productsPerPage;
  const sort = p(searchParams, 'sort') || 'featured';
  const categorySlugs = p(searchParams, 'category').split(',').filter(Boolean);
  const brandSlugs = p(searchParams, 'brand').split(',').filter(Boolean);
  const minPrice = Number(p(searchParams, 'min')) || 0;
  const maxPrice = Number(p(searchParams, 'max')) || 0;
  const sizes = p(searchParams, 'size').split(',').filter(Boolean);
  const sale = p(searchParams, 'sale') === '1';
  const inStock = p(searchParams, 'stock') === '1';
  const q = p(searchParams, 'q');

  // Resolve categories (include children)
  let categoryIds: string[] = [];
  if (categorySlugs.length) {
    const cats = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      include: { children: { select: { id: true } } },
    });
    categoryIds = cats.flatMap((c) => [c.id, ...c.children.map((ch) => ch.id)]);
  }

  let brandIds: string[] = [];
  if (brandSlugs.length) {
    const bs = await prisma.brand.findMany({ where: { slug: { in: brandSlugs } }, select: { id: true } });
    brandIds = bs.map((b) => b.id);
  }

  const where: any = { status: 'published' };
  if (categoryIds.length) where.categoryId = { in: categoryIds };
  if (brandIds.length) where.brandId = { in: brandIds };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }
  if (sale) where.comparePrice = { not: null };
  if (inStock) where.stock = { gt: 0 };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { nameBn: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
      { sku: { contains: q } },
    ];
  }
  if (sizes.length) {
    where.OR = [
      ...(where.OR || []),
      ...sizes.map((s) => ({ variants: { contains: `"size":"${s}"` } })),
    ];
  }

  const orderBy: any =
    sort === 'newest' ? { createdAt: 'desc' }
    : sort === 'price-asc' ? { price: 'asc' }
    : sort === 'price-desc' ? { price: 'desc' }
    : sort === 'popular' ? { soldCount: 'desc' }
    : sort === 'rating' ? { rating: 'desc' }
    : [{ featured: 'desc' }, { soldCount: 'desc' }];

  const [products, total, categories, brands, priceAgg] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { status: 'active' },
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } }, parent: { select: { name: true } } },
    }),
    prisma.brand.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } }),
    prisma.product.aggregate({ _min: { price: true }, _max: { price: true } }),
  ]);

  // Track search query
  if (q) {
    prisma.searchQuery.create({ data: { query: q, results: total } }).catch(() => {});
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const activeFilters: { label: string; href: string }[] = [];

  const baseParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (k !== 'page' && typeof v === 'string') baseParams.set(k, v);
  });

  function removeFilter(key: string, value?: string) {
    const sp = new URLSearchParams(baseParams);
    if (value) {
      const cur = (sp.get(key) || '').split(',').filter(Boolean).filter((x) => x !== value);
      if (cur.length) sp.set(key, cur.join(',')); else sp.delete(key);
    } else sp.delete(key);
    sp.delete('page');
    return `/shop?${sp.toString()}`;
  }

  categorySlugs.forEach((c) => activeFilters.push({ label: cap(c), href: removeFilter('category', c) }));
  brandSlugs.forEach((b) => activeFilters.push({ label: cap(b), href: removeFilter('brand', b) }));
  sizes.forEach((s) => activeFilters.push({ label: `Size ${s}`, href: removeFilter('size', s) }));
  if (sale) activeFilters.push({ label: 'On Sale', href: removeFilter('sale') });
  if (inStock) activeFilters.push({ label: 'In Stock', href: removeFilter('stock') });
  if (q) activeFilters.push({ label: `"${q}"`, href: removeFilter('q') });
  if (minPrice || maxPrice)
    activeFilters.push({ label: `৳${minPrice}–৳${maxPrice || '∞'}`, href: `/shop` });

  function pageHref(n: number) {
    const sp = new URLSearchParams(baseParams);
    sp.set('page', String(n));
    return `/shop?${sp.toString()}`;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="border-b border-ink-100 bg-ink-50/60" aria-label="Breadcrumb">
        <div className="container-x flex h-11 items-center gap-2 text-[13px] text-ink-500">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span>/</span>
          <span className="font-semibold text-ink-800">{q ? `Search: ${q}` : 'Shop'}</span>
        </div>
      </nav>

      <div className="container-x py-7">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {q ? `Search results for "${q}"` : categorySlugs.length === 1 ? cap(categorySlugs[0]) : 'All Products'}
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-500">
            {formatNumber(total)} {total === 1 ? 'product' : 'products'} found
            {priceAgg._min.price != null && (
              <span className="ml-2 text-ink-400">
                · ৳{Math.floor(priceAgg._min.price)} – ৳{Math.ceil(priceAgg._max.price || 0)}
              </span>
            )}
          </p>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-ink-500">Filters:</span>
            {activeFilters.map((f) => (
              <Link
                key={f.label}
                href={f.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                {f.label} <X className="h-3 w-3" />
              </Link>
            ))}
            <Link href="/shop" className="text-[13px] font-semibold text-ink-500 underline hover:text-ink-800">
              Clear all
            </Link>
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[248px_1fr]">
          {/* Sidebar filters */}
          <ShopFilters
            categories={categories.map((c) => ({
              id: c.id, name: c.name, slug: c.slug, count: c._count.products, parent: c.parent?.name || null,
            }))}
            brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
            current={{
              category: categorySlugs, brand: brandSlugs, size: sizes,
              min: minPrice || undefined, max: maxPrice || undefined,
              sale, stock: inStock, sort, q,
            }}
            priceRange={{ min: Math.floor(priceAgg._min.price || 0), max: Math.ceil(priceAgg._max.price || 10000) }}
          />

          {/* Grid */}
          <div>
            {/* Toolbar */}
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5">
              <span className="hidden text-[13px] font-medium text-ink-500 sm:block">
                Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="sort" className="text-[13px] font-semibold text-ink-600">Sort:</label>
                <SortSelect current={sort} base={baseParams.toString()} />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-20 text-center">
                <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-ink-300" />
                <h3 className="text-lg font-bold text-ink-800">No products found</h3>
                <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-500">
                  Try adjusting your filters or search terms. We add new products every week.
                </p>
                <Link href="/shop" className="btn-primary mt-5">Browse all products</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                  {products.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-9 flex items-center justify-center gap-1.5" aria-label="Pagination">
                    {page > 1 && (
                      <Link href={pageHref(page - 1)} className="btn-outline btn-sm">← Prev</Link>
                    )}
                    {paginationRange(page, totalPages).map((n, i) =>
                      n === '...' ? (
                        <span key={`e${i}`} className="px-1.5 text-ink-400">…</span>
                      ) : (
                        <Link
                          key={n}
                          href={pageHref(n as number)}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-[13px] font-bold transition ${
                            n === page
                              ? 'bg-ink-900 text-white'
                              : 'border border-ink-200 bg-white text-ink-700 hover:border-ink-900'
                          }`}
                        >
                          {n}
                        </Link>
                      )
                    )}
                    {page < totalPages && (
                      <Link href={pageHref(page + 1)} className="btn-outline btn-sm">Next →</Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function paginationRange(cur: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | string)[] = [1];
  if (cur > 3) out.push('...');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) out.push(i);
  if (cur < total - 2) out.push('...');
  out.push(total);
  return out;
}

import SortSelect from '@/components/store/SortSelect';
