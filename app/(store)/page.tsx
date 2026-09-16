import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Tag, Zap, Truck, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import ProductCard from '@/components/store/ProductCard';
import { parseJSON, formatPrice, cn } from '@/lib/utils';

export const revalidate = 60;

// The home page is the site's front door, so its title is the full branded
// version. `absolute` keeps the root layout's "%s | BD Market" template from
// appending the brand a second time.
export const metadata: Metadata = {
  title: { absolute: 'BD Market — Bangladesh Fashion & Lifestyle Online Store' },
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const config = await getSiteConfig();

  const [banners, categories, featured, newArrivals, bestsellers, saleProducts, posts, brands] =
    await Promise.all([
      prisma.banner.findMany({ where: { status: 'active' }, orderBy: { position_order: 'asc' } }),
      prisma.category.findMany({
        where: { parentId: null, status: 'active' },
        orderBy: { position: 'asc' },
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.findMany({
        where: { status: 'published', featured: true },
        take: 8,
        orderBy: { soldCount: 'desc' },
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      }),
      prisma.product.findMany({
        where: { status: 'published', newArrival: true },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      }),
      prisma.product.findMany({
        where: { status: 'published', bestseller: true },
        take: 4,
        orderBy: { soldCount: 'desc' },
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      }),
      prisma.product.findMany({
        where: { status: 'published', comparePrice: { not: null } },
        take: 8,
        orderBy: { soldCount: 'desc' },
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      }),
      prisma.post.findMany({ where: { status: 'published' }, take: 3, orderBy: { publishedAt: 'desc' } }),
      prisma.brand.findMany({ where: { status: 'active', featured: true }, take: 8 }),
    ]);

  const hero = banners.filter((b) => b.position === 'hero');
  const promos = banners.filter((b) => b.position.startsWith('promo'));

  return (
    <div className="animate-fade-in">
      {/* ═══ HERO — same container-x width as every other section ═══ */}
      <section className="bg-white py-4 sm:py-6">
        <div className="container-x">
          <div className="grid overflow-hidden rounded-2xl bg-ink-900 shadow-card sm:rounded-3xl lg:grid-cols-[1.35fr_1fr]">
            {/* Main hero */}
            <div className="relative min-h-[420px] overflow-hidden sm:min-h-[480px] lg:min-h-[560px]">
              {hero[0] && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={hero[0].image}
                    alt={hero[0].title}
                    className="absolute inset-0 h-full w-full object-cover"
                    fetchPriority="high"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink-950/92 via-ink-950/70 to-ink-950/25" />
                </>
              )}
              <div className="relative flex h-full flex-col justify-center px-6 py-12 sm:px-10 lg:px-14 lg:py-20">
                <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[.15em] text-white backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  {hero[0]?.title || 'Eid Collection 2026'}
                </span>
                <h1 className="max-w-xl font-display text-[28px] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[52px]">
                  {config.homepage.heroHeading}
                </h1>
                <p className="bn mt-4 max-w-lg text-[15px] leading-relaxed text-ink-200 sm:text-base">
                  {hero[0]?.subtitle || 'হাতে বোনা জামদানি থেকে ফেস্টিভ পাঞ্জাবি — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।'}
                </p>
                <div className="mt-7 flex flex-col gap-3 xs:flex-row xs:flex-wrap xs:items-center">
                  <Link
                    href={hero[0]?.ctaHref || '/shop'}
                    className="group inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 text-base font-bold text-white shadow-lg shadow-brand-950/30 transition-all duration-200 hover:bg-brand-500 hover:shadow-xl active:scale-[.97] xs:w-auto"
                  >
                    {hero[0]?.ctaLabel || 'Shop Now'}
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/shop?sale=1"
                    className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur transition-all duration-200 hover:border-white/50 hover:bg-white/20 active:scale-[.97] xs:w-auto"
                  >
                    <Tag className="h-4 w-4" /> View Sale
                  </Link>
                </div>

                {/* Trust row — payment/delivery reassurance right under the CTAs */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-ink-200">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-brand-300" /> Cash on Delivery
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-brand-300" /> 7-Day Returns
                  </span>
                </div>

                {/* Figures are editable at Settings -> Homepage. A stat whose
                    figure is emptied there is dropped from the row. */}
                {config.homepage.heroStats.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-white">
                    {config.homepage.heroStats.map((s) => (
                      <div key={s.label}>
                        <p className="font-display text-2xl font-bold">{s.value}</p>
                        <p className="text-[13px] text-ink-300">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Side heroes */}
            <div className="grid grid-rows-2">
              {hero.slice(1, 3).map((b) => (
                <Link
                  key={b.id}
                  href={b.ctaHref || '/shop'}
                  className="group relative min-h-[190px] overflow-hidden border-b border-ink-800 last:border-b-0 lg:min-h-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/50 to-transparent" />
                  <div className="relative flex h-full flex-col justify-end p-5">
                    <h2 className="font-display text-xl font-bold text-white">{b.title}</h2>
                    <p className="mt-1 line-clamp-2 text-[15px] text-ink-200">{b.subtitle}</p>
                    <span className="mt-3 inline-flex w-fit items-center gap-1.5 text-[15px] font-bold text-brand-300 transition group-hover:gap-2.5">
                      {b.ctaLabel || 'Shop'} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY STRIP ═══ */}
      <section className="border-b border-ink-100 bg-white py-8">
        <div className="container-x">
          <div className="scroll-x lg:grid lg:grid-cols-9 lg:gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex w-[72px] shrink-0 snap-start flex-col items-center gap-2.5 lg:w-auto"
              >
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 text-2xl transition group-hover:border-brand-400 group-hover:bg-brand-50 group-hover:shadow-md lg:h-[70px] lg:w-[70px]">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    c.icon || '🛍️'
                  )}
                </span>
                <span className="text-center">
                  <span className="block text-[12px] font-semibold leading-tight text-ink-800 group-hover:text-brand-700">
                    {c.name}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-400">{c._count.products} items</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROMO BANNERS ═══ */}
      {promos.length > 0 && (
        <section className="py-10">
          <div className="container-x grid gap-4 sm:grid-cols-2">
            {promos.map((p) => (
              <Link
                key={p.id}
                href={p.ctaHref || '/shop'}
                className="group relative flex min-h-[150px] items-center overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft transition hover:shadow-card"
              >
                <div className="relative z-10 max-w-[60%] p-6">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-brand-700">
                    <Zap className="h-3 w-3" /> Offer
                  </span>
                  <h3 className="font-display text-xl font-bold text-ink-900">{p.title}</h3>
                  <p className="mt-1 text-[13px] text-ink-500">{p.subtitle}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-700 transition group-hover:gap-2.5">
                    {p.ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="absolute -right-4 -top-4 h-[110%] w-[42%] overflow-hidden rounded-l-[60px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ FEATURED ═══ */}
      <ProductSection
        eyebrow="Handpicked"
        title="Featured Collection"
        subtitle="Our most-loved pieces this season"
        href="/shop?sort=popular"
        products={featured}
      />

      {/* ═══ SALE BANNER ═══ */}
      <section className="my-12 bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900">
        <div className="container-x flex flex-col items-center justify-between gap-6 py-10 text-center sm:flex-row sm:text-left">
          <div className="text-white">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-bold uppercase tracking-wider backdrop-blur">
              <Tag className="h-3.5 w-3.5" /> Limited Time
            </span>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Festive Sale — Up to 30% Off</h2>
            <p className="bn mt-2 text-[15px] text-ink-200">
              ব্যবহার করে <span className="font-bold text-amber-300">EIDSALE25</span> কুপন — অতিরিক্ত ২৫% ছাড়
            </p>
          </div>
          <Link href="/shop?sale=1" className="btn-lg shrink-0 bg-white font-bold text-ink-900 shadow-lg transition hover:bg-ink-100">
            Shop Sale <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ═══ NEW ARRIVALS ═══ */}
      <ProductSection
        eyebrow="Just In"
        title="New Arrivals"
        subtitle="Fresh drops added this week"
        href="/shop?sort=newest"
        products={newArrivals}
      />

      {/* ═══ BRANDS ═══ */}
      {brands.length > 0 && (
        <section className="border-y border-ink-100 bg-ink-50/60 py-10">
          <div className="container-x">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="eyebrow">Trusted Labels</p>
                <h2 className="section-title mt-1">Shop by Brand</h2>
              </div>
              <Link href="/brands" className="hidden text-[15px] font-semibold text-brand-700 hover:underline sm:inline">
                All brands →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {brands.map((b) => (
                <Link
                  key={b.id}
                  href={`/brand/${b.slug}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 py-5 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
                >
                  {/* The brand's uploaded logo when it has one, otherwise its
                      initial. This used to draw the initial unconditionally, so
                      a logo set in the admin never appeared here. */}
                  <span
                    className={cn(
                      'flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl',
                      b.logo
                        ? 'border border-ink-100 bg-white p-1'
                        : 'bg-brand-50 font-display text-base font-bold text-brand-700'
                    )}
                  >
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt={b.name} className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      b.name.charAt(0)
                    )}
                  </span>
                  <span className="text-[12px] font-semibold leading-tight text-ink-700">{b.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BESTSELLERS (horizontal) ═══ */}
      <section className="py-12">
        <div className="container-x">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Most Popular
              </p>
              <h2 className="section-title mt-1">Bestsellers</h2>
            </div>
            <Link href="/shop?sort=popular" className="shrink-0 text-[15px] font-semibold text-brand-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY US ═══ */}
      <section className="border-t border-ink-100 bg-white py-12">
        <div className="container-x">
          <div className="mb-8 text-center">
            <p className="eyebrow">Why BD Market</p>
            <h2 className="section-title mt-2">Shopping Made Simple in Bangladesh</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🚚', t: 'Nationwide Free Delivery', d: `Free shipping on orders over ${formatPrice(config.freeShippingOver)}. Delivered to all 64 districts.` },
              { icon: '💵', t: 'Cash on Delivery', d: 'Pay only when the parcel reaches your hand. No advance payment needed.' },
              { icon: '📱', t: 'bKash, Nagad & Card', d: 'Pay with your favourite mobile wallet or card via SSLCommerz.' },
              { icon: '↩️', t: '7-Day Easy Returns', d: 'Not satisfied? Return unused items within 7 days for a refund or exchange.' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-ink-200/70 bg-white p-6 text-center transition hover:border-brand-300 hover:shadow-soft">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                  {f.icon}
                </span>
                <h3 className="text-[15px] font-bold text-ink-900">{f.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-500">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOG ═══ */}
      {posts.length > 0 && (
        <section className="border-t border-ink-100 py-12">
          <div className="container-x">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">From the Journal</p>
                <h2 className="section-title mt-1">Fashion, Culture & Guides</h2>
              </div>
              <Link href="/blog" className="shrink-0 text-[15px] font-semibold text-brand-700 hover:underline">
                All articles →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-ink-200/70 bg-white transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
                    {p.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-ink-800 backdrop-blur">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-700">
                      {p.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{p.excerpt}</p>
                    <p className="mt-3 text-[12px] font-medium text-ink-400">
                      {p.readMinutes} min read · {p.viewCount.toLocaleString()} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ProductSection({
  eyebrow, title, subtitle, href, products,
}: {
  eyebrow: string; title: string; subtitle: string; href: string; products: any[];
}) {
  if (!products.length) return null;
  return (
    <section className="py-12">
      <div className="container-x">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="section-title mt-1 text-balance">{title}</h2>
            <p className="mt-1.5 text-[15px] text-ink-500">{subtitle}</p>
          </div>
          <Link href={href} className="shrink-0 text-[15px] font-semibold text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
