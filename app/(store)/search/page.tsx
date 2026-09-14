import type { Metadata } from 'next';
import Link from 'next/link';
import { Search as SearchIcon, PackageX } from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import ProductCard from '@/components/store/ProductCard';
import { parseJSON } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Promise<Metadata> {
  const q = searchParams.q || '';
  return {
    title: q ? `Search: ${q}` : 'Search Products',
    description: q ? `Search results for "${q}" at BD Market.` : 'Search our full product catalogue.',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || '').trim();
  const config = await getSiteConfig();

  let products: any[] = [];
  let categories: any[] = [];
  let brands: any[] = [];

  if (q) {
    const where = {
      status: 'published',
      OR: [
        { name: { contains: q } },
        { nameBn: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
        { sku: { contains: q } },
        { fabric: { contains: q } },
      ],
    };

    [products, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where, take: 40, orderBy: [{ soldCount: 'desc' }],
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      }),
      prisma.category.findMany({ where: { name: { contains: q }, status: 'active' }, take: 6 }),
      prisma.brand.findMany({ where: { name: { contains: q }, status: 'active' }, take: 6 }),
    ]);

    prisma.searchQuery.create({ data: { query: q, results: products.length } }).catch(() => {});
  }

  const popular = await prisma.searchQuery.groupBy({
    by: ['query'], _count: { _all: true },
    orderBy: { _count: { query: 'desc' } }, take: 8,
  });

  return (
    <div className="container-x py-10">
      <nav className="mb-4 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
        <span className="font-semibold text-ink-800">Search</span>
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
        {q ? `Results for "${q}"` : 'Search Products'}
      </h1>

      {/* Search box */}
      <form action="/search" method="GET" className="relative mt-5 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
        <input
          name="q"
          defaultValue={q}
          autoFocus={!q}
          placeholder="Search panjabi, saree, kurti, brand…"
          className="input input-lg pl-11 pr-28"
          aria-label="Search products"
        />
        <button type="submit" className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2">
          Search
        </button>
      </form>

      {/* Popular searches */}
      {!q && popular.length > 0 && (
        <div className="mt-7">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-500">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {popular.map((p) => (
              <Link key={p.query} href={`/search?q=${encodeURIComponent(p.query)}`} className="chip">
                {p.query} <span className="text-ink-400">({p._count._all})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {q && (
        <>
          {/* Matching categories/brands */}
          {(categories.length > 0 || brands.length > 0) && (
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {categories.length > 0 && (
                <div className="rounded-2xl border border-ink-200 bg-white p-5">
                  <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-500">Matching Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Link key={c.id} href={`/category/${c.slug}`} className="chip">
                        {c.icon} {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {brands.length > 0 && (
                <div className="rounded-2xl border border-ink-200 bg-white p-5">
                  <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-500">Matching Brands</p>
                  <div className="flex flex-wrap gap-2">
                    {brands.map((b) => (
                      <Link key={b.id} href={`/brand/${b.slug}`} className="chip">{b.name}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {products.length > 0 ? (
            <>
              <p className="mt-8 text-[15px] text-ink-500">
                Found <strong className="text-ink-900">{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-16 text-center">
              <PackageX className="mx-auto mb-4 h-10 w-10 text-ink-300" />
              <h2 className="text-lg font-bold text-ink-800">No results for "{q}"</h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-500">
                Try a different spelling, use a broader term, or browse our categories.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Link href="/shop" className="btn-primary">Browse All Products</Link>
                <Link href="/category/women" className="btn-outline">Women's Collection</Link>
                <Link href="/category/panjabi" className="btn-outline">Panjabi</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
