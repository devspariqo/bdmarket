import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import ProductCard from '@/components/store/ProductCard';
import { formatNumber, pageTitle } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!cat) return { title: 'Category Not Found' };
  const config = await getSiteConfig();
  return {
    title: pageTitle(cat.metaTitle, `${cat.name} Collection`),
    description: cat.metaDesc || `Shop ${cat.name} online in Bangladesh at ${config.siteName}. Cash on delivery nationwide.`,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: { title: `${cat.name} — ${config.siteName}`, description: cat.metaDesc || '', images: cat.image ? [cat.image] : undefined },
  };
}

export default async function CategoryPage({
  params, searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string; page?: string };
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: { children: { orderBy: { position: 'asc' } }, parent: true },
  });
  if (!category || category.status !== 'active') notFound();

  const config = await getSiteConfig();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = config.appearance.productsPerPage;
  const sort = searchParams.sort || 'featured';

  const catIds = [category.id, ...category.children.map((c) => c.id)];

  const orderBy: any =
    sort === 'newest' ? { createdAt: 'desc' }
    : sort === 'price-asc' ? { price: 'asc' }
    : sort === 'price-desc' ? { price: 'desc' }
    : sort === 'popular' ? { soldCount: 'desc' }
    : sort === 'rating' ? { rating: 'desc' }
    : [{ featured: 'desc' }, { soldCount: 'desc' }];

  const [products, total, featured] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'published', categoryId: { in: catIds } },
      orderBy, skip: (page - 1) * perPage, take: perPage,
      include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
    }),
    prisma.product.count({ where: { status: 'published', categoryId: { in: catIds } } }),
    prisma.product.findMany({
      where: { status: 'published', categoryId: { in: catIds }, featured: true },
      take: 4, orderBy: { soldCount: 'desc' },
      include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: config.siteUrl },
      ...(category.parent
        ? [{ '@type': 'ListItem', position: 2, name: category.parent.name, item: `${config.siteUrl}/category/${category.parent.slug}` }]
        : [{ '@type': 'ListItem', position: 2, name: 'Shop', item: `${config.siteUrl}/shop` }]),
      { '@type': 'ListItem', position: 3, name: category.name, item: `${config.siteUrl}/category/${category.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* Category hero */}
      <section className="relative overflow-hidden bg-ink-900">
        {category.image && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={category.image} alt={category.name} className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 to-ink-950/50" />
          </>
        )}
        <div className="container-x relative py-12 sm:py-16">
          <nav className="mb-3 flex items-center gap-2 text-[13px] text-ink-300">
            <Link href="/" className="hover:text-white">Home</Link><span>/</span>
            {category.parent && (
              <>
                <Link href={`/category/${category.parent.slug}`} className="hover:text-white">{category.parent.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-white">{category.name}</span>
          </nav>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {category.name} {category.icon}
          </h1>
          {category.nameBn && <p className="bn mt-2 text-base text-ink-200">{category.nameBn}</p>}
          <p className="mt-3 text-[15px] text-ink-300">
            {formatNumber(total)} {total === 1 ? 'product' : 'products'} available
          </p>
        </div>
      </section>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <section className="border-b border-ink-100 bg-white py-6">
          <div className="container-x">
            <div className="scroll-x lg:flex-wrap">
              {category.children.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/category/${ch.slug}`}
                  className="flex shrink-0 snap-start items-center gap-2.5 rounded-2xl border border-ink-200 bg-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
                >
                  {ch.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ch.image} alt="" className="h-10 w-10 rounded-xl object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">{ch.icon}</span>
                  )}
                  <span>
                    <span className="block text-[13px] font-bold text-ink-800">{ch.name}</span>
                    {ch.nameBn && <span className="bn block text-[12px] text-ink-400">{ch.nameBn}</span>}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container-x py-8">
        {/* Sort bar */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5">
          <span className="text-[13px] font-medium text-ink-500">
            Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { v: 'featured', l: 'Featured' },
              { v: 'newest', l: 'Newest' },
              { v: 'popular', l: 'Popular' },
              { v: 'price-asc', l: 'Price ↑' },
              { v: 'price-desc', l: 'Price ↓' },
              { v: 'rating', l: 'Top Rated' },
            ].map((s) => (
              <Link
                key={s.v}
                href={`/category/${category.slug}?sort=${s.v}`}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
                  sort === s.v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {s.l}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-20 text-center">
            <h3 className="text-lg font-bold text-ink-800">No products in this category yet</h3>
            <p className="mt-2 text-[15px] text-ink-500">Check back soon — new stock arrives weekly.</p>
            <Link href="/shop" className="btn-primary mt-5">Browse all products</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {totalPages > 1 && (
              <nav className="mt-9 flex items-center justify-center gap-1.5">
                {page > 1 && <Link href={`/category/${category.slug}?sort=${sort}&page=${page - 1}`} className="btn-outline btn-sm">← Prev</Link>}
                <span className="px-3 text-[13px] font-semibold text-ink-600">Page {page} of {totalPages}</span>
                {page < totalPages && <Link href={`/category/${category.slug}?sort=${sort}&page=${page + 1}`} className="btn-outline btn-sm">Next →</Link>}
              </nav>
            )}
          </>
        )}

        {/* SEO copy */}
        <section className="mt-12 rounded-2xl border border-ink-200 bg-ink-50/50 p-6">
          <h2 className="font-display text-lg font-bold text-ink-900">
            Buy {category.name} Online in Bangladesh
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-600">
            {category.description ||
              `Explore our curated ${category.name.toLowerCase()} collection at ${config.siteName}. Every piece is sourced from trusted Bangladeshi manufacturers and artisans, quality-checked before dispatch, and delivered to all 64 districts with cash on delivery. Enjoy free shipping on orders above ৳${config.freeShippingOver}, easy 7-day returns, and payment via bKash, Nagad, Rocket or card.`}
          </p>
        </section>
      </div>
    </>
  );
}
