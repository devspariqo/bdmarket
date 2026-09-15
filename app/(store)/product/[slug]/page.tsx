import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Truck, ShieldCheck, RotateCcw, Minus, Check, Package } from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig, getPaymentLogos } from '@/lib/settings';
import { uploadedPaymentLogos } from '@/lib/payment-logos';
import { formatPrice, discountPercent, parseJSON, pageTitle } from '@/lib/utils';
import ProductDetailClient from '@/components/store/ProductDetailClient';
import ProductCard, { Stars } from '@/components/store/ProductCard';
import ProductTabs from '@/components/store/ProductTabs';
import ProductDescription from '@/components/store/ProductDescription';
import ProductSpecs from '@/components/store/ProductSpecs';
import ProductReviews from '@/components/store/ProductReviews';
import { PaymentLogoImage } from '@/components/PaymentLogoImage';

/**
 * Rendered on demand — never prerendered.
 *
 * This route used to declare `generateStaticParams`, which made Next.js build
 * every product page as static HTML. It was the only storefront route marked
 * ● (SSG) in the build output, while `/`, `/category/[slug]`, `/brand/[slug]`,
 * `/blog/[slug]` and the rest all came out ƒ (Dynamic).
 *
 * That combination is not safe here, because every storefront page is wrapped
 * by `app/(store)/layout.tsx`, which reads `cookies()` for the cart count and
 * the customer session — and a statically prerendered route is not allowed to
 * touch a dynamic API.
 *
 * `next dev` and a local `next start` tolerate the mismatch and quietly fall
 * back to dynamic rendering, so it looked fine in development. A strict
 * production runtime enforces the rule instead: Hostinger builds with
 * `output: 'standalone'`, and there every `/product/<slug>` request failed with
 * DYNAMIC_SERVER_USAGE (HTTP 500) while the rest of the site kept working.
 *
 * The layout already forces dynamic rendering on the whole subtree, so the
 * prerendered HTML was never actually servable. Dropping `generateStaticParams`
 * costs nothing and makes this route behave like `/category/[slug]` and
 * `/brand/[slug]`, which have always rendered correctly.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true, brand: true },
  });
  if (!p) return { title: 'Product Not Found' };

  const config = await getSiteConfig();
  const images = parseJSON<string[]>(p.images, []);
  const url = `/product/${p.slug}`;

  // Seeded and admin-edited metaTitles are full titles that already carry the
  // store name; pageTitle() keeps the layout template from appending it twice.
  const rawTitle = p.metaTitle || p.name;
  const title = pageTitle(p.metaTitle, p.name);

  return {
    title,
    description: p.metaDesc || p.shortDesc || config.seo.defaultDesc,
    keywords: p.metaKeywords?.split(',').map((k) => k.trim()) || undefined,
    alternates: { canonical: p.canonical || url },
    openGraph: {
      type: 'website',
      title: rawTitle,
      description: p.metaDesc || p.shortDesc || config.seo.defaultDesc,
      url,
      images: images.length ? [{ url: images[0], width: 900, height: 1200, alt: p.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: p.name,
      description: p.shortDesc || config.seo.defaultDesc,
      images: images.length ? [images[0]] : undefined,
    },
    other: {
      'product:price:amount': String(p.price),
      'product:price:currency': 'BDT',
      'product:availability': p.stock > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const config = await getSiteConfig();
  const paymentLogos = await getPaymentLogos();
  // Logos only: a method with no artwork uploaded has nothing to draw, so it is
  // dropped rather than leaving an empty cell. Nine fills the 3-column grid.
  const payments = uploadedPaymentLogos(paymentLogos).slice(0, 9);

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: { include: { parent: true } },
      brand: true,
      reviews: {
        where: { status: 'approved' },
        orderBy: { createdAt: 'desc' },
        take: 8,
      },
    },
  });

  if (!product || product.status !== 'published') notFound();

  // Increment view count (fire and forget)
  prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const images = parseJSON<string[]>(product.images, []);
  const variants = parseJSON<any[]>(product.variants, []);
  const attributes = parseJSON<{ name: string; values: string[] }[]>(product.attributes, []);
  const sizes = attributes.find((a) => a.name === 'Size')?.values || [];
  const colors = attributes.find((a) => a.name === 'Color')?.values || [];
  const discount = discountPercent(product.price, product.comparePrice);

  // Related products
  const related = await prisma.product.findMany({
    where: {
      status: 'published',
      id: { not: product.id },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    take: 4,
    orderBy: { soldCount: 'desc' },
    include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
  });

  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = product.reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: product.reviews.length ? (count / product.reviews.length) * 100 : 0 };
  });

  /**
   * "At a glance" bullets for the Description tab.
   *
   * Derived from fields the merchant has already filled in rather than asking
   * them to write a separate summary — so this works on every existing product
   * with no data migration. Only facts that are genuinely reassuring to a
   * Bangladeshi shopper are included, and empties are filtered out.
   */
  const highlights = [
    product.fabric && `Fabric: ${product.fabric}`,
    product.fit && `Fit: ${product.fit}`,
    product.occasion && `Best for: ${product.occasion}`,
    ...attributes
      .filter((a) => a.name !== 'Size' && a.name !== 'Color' && a.values?.length)
      .slice(0, 2)
      .map((a) => `${a.name}: ${a.values.join(', ')}`),
    product.careInstructions && `Care: ${product.careInstructions}`,
    product.countryOfOrigin && `Made in ${product.countryOfOrigin}`,
    product.stock > 0 && product.stock <= 10 && `Only ${product.stock} left in stock`,
    'Cash on delivery available nationwide',
    '7-day return on unused items',
  ].filter(Boolean) as string[];

  // ── JSON-LD ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc || product.description?.slice(0, 300),
    sku: product.sku,
    mpn: product.barcode || product.sku,
    image: images,
    brand: { '@type': 'Brand', name: product.brand?.name || config.siteName },
    category: product.category?.name,
    countryOfOrigin: product.countryOfOrigin,
    material: product.fabric || undefined,
    offers: {
      '@type': 'Offer',
      url: `${config.siteUrl}/product/${product.slug}`,
      priceCurrency: 'BDT',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: config.siteName },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 60, currency: 'BDT' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BD' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 7, unitCode: 'DAY' },
        },
      },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(product.reviews.length && {
      review: product.reviews.slice(0, 5).map((r) => ({
        '@type': 'Review',
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        author: { '@type': 'Person', name: r.authorName },
        name: r.title,
        reviewBody: r.body,
        datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
      })),
    }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: config.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${config.siteUrl}/shop` },
      ...(product.category
        ? [{ '@type': 'ListItem', position: 3, name: product.category.name, item: `${config.siteUrl}/category/${product.category.slug}` }]
        : []),
      { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name, item: `${config.siteUrl}/product/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div>
        {/* Breadcrumb */}
        <nav className="border-b border-ink-100 bg-ink-50/60" aria-label="Breadcrumb">
          <div className="container-x flex h-11 items-center gap-2 overflow-x-auto text-[13px] text-ink-500 no-scrollbar">
            <Link href="/" className="shrink-0 hover:text-brand-700">Home</Link>
            <span>/</span>
            <Link href="/shop" className="shrink-0 hover:text-brand-700">Shop</Link>
            {product.category && (
              <>
                <span>/</span>
                {product.category.parent && (
                  <>
                    <Link href={`/category/${product.category.parent.slug}`} className="shrink-0 hover:text-brand-700">
                      {product.category.parent.name}
                    </Link>
                    <span>/</span>
                  </>
                )}
                <Link href={`/category/${product.category.slug}`} className="shrink-0 hover:text-brand-700">
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="truncate font-semibold text-ink-800">{product.name}</span>
          </div>
        </nav>

        <div className="container-x py-7">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Gallery */}
            <ProductGallery images={images} name={product.name} discount={discount} />

            {/* Info */}
            <div>
              {product.brand && (
                <Link href={`/brand/${product.brand.slug}`} className="eyebrow hover:underline">
                  {product.brand.name}
                </Link>
              )}
              <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink-900 sm:text-3xl lg:text-[34px]">
                {product.name}
              </h1>
              {product.nameBn && <p className="bn mt-2 text-base text-ink-500">{product.nameBn}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Stars rating={product.rating} size={15} />
                <span className="text-[13px] font-semibold text-ink-600">
                  {product.rating.toFixed(1)}
                  <span className="font-normal text-ink-400"> ({product.reviewCount} reviews)</span>
                </span>
                <span className="h-3 w-px bg-ink-200" />
                <span className="text-[13px] font-medium text-emerald-700">{product.soldCount} sold</span>
                <span className="text-[13px] text-ink-400">· {product.viewCount.toLocaleString()} views</span>
              </div>

              {/* Price */}
              <div className="mt-5 flex flex-wrap items-end gap-3">
                <span className="font-display text-3xl font-bold text-ink-900">{formatPrice(product.price)}</span>
                {discount > 0 && product.comparePrice && (
                  <>
                    <span className="text-lg text-ink-400 line-through">{formatPrice(product.comparePrice)}</span>
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-[13px] font-bold text-rose-700">
                      Save {formatPrice(product.comparePrice - product.price)} ({discount}%)
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-ink-500">
                Price inclusive of all taxes · Cash on Delivery available
              </p>

              {product.shortDesc && (
                <p className="mt-5 border-l-2 border-brand-500 pl-4 text-[15px] leading-relaxed text-ink-600">
                  {product.shortDesc}
                </p>
              )}

              {/* Stock */}
              <div className="mt-5 flex items-center gap-2">
                {product.stock > 0 ? (
                  product.stock <= product.lowStockAlert ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[13px] font-bold text-amber-800">
                      <Package className="h-3.5 w-3.5" /> Only {product.stock} left in stock!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-800">
                      <Check className="h-3.5 w-3.5" /> In Stock — ready to ship
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[13px] font-bold text-rose-800">
                    <Minus className="h-3.5 w-3.5" /> Out of Stock
                  </span>
                )}
              </div>

              {/* Variants + cart (client) */}
              <ProductDetailClient
                product={{
                  id: product.id, name: product.name, slug: product.slug, price: product.price,
                  images, stock: product.stock, sku: product.sku, sizes, colors, variants,
                  maxQty: Math.min(product.stock, config.appearance.productsPerPage > 0 ? 10 : 10),
                }}
              />

              {/* Trust badges */}
              <div className="mt-7 grid grid-cols-3 gap-3 border-t border-ink-100 pt-6">
                {[
                  { icon: Truck, t: 'Free over ৳' + config.freeShippingOver, s: '1–7 days nationwide' },
                  { icon: ShieldCheck, t: 'Secure Payment', s: 'bKash · Nagad · Card' },
                  { icon: RotateCcw, t: '7-Day Returns', s: 'Easy & hassle free' },
                ].map((b) => (
                  <div key={b.t} className="text-center">
                    <b.icon className="mx-auto mb-1.5 h-5 w-5 text-brand-600" />
                    <p className="text-[12px] font-bold leading-tight text-ink-800">{b.t}</p>
                    <p className="mt-0.5 text-[12px] text-ink-400">{b.s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Description / Specifications / Reviews ═══ */}
          <div className="mt-14 border-t border-ink-200 pt-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                <ProductTabs
                  reviewCount={product.reviewCount}
                  description={
                    <ProductDescription
                      description={product.description}
                      shortDesc={product.shortDesc}
                      highlights={highlights}
                    />
                  }
                  specs={
                    <ProductSpecs
                      sku={product.sku}
                      barcode={product.barcode}
                      type={product.type}
                      category={product.category?.name}
                      brand={product.brand?.name}
                      stockStatus={product.stockStatus}
                      stock={product.stock}
                      attributes={attributes}
                      fabric={product.fabric}
                      fit={product.fit}
                      occasion={product.occasion}
                      careInstructions={product.careInstructions}
                      countryOfOrigin={product.countryOfOrigin}
                      weight={product.weight}
                      dimensions={product.dimensions}
                    />
                  }
                  reviews={
                    <ProductReviews
                      reviews={product.reviews.map((r) => ({
                        id: r.id,
                        authorName: r.authorName,
                        rating: r.rating,
                        title: r.title,
                        body: r.body,
                        createdAt: r.createdAt as unknown as string,
                        verified: r.verified,
                      }))}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      ratingDist={ratingDist}
                    />
                  }
                />

                {/* The review form sits outside the tab panels so it is reachable
                    from any tab without the shopper having to hunt for it. */}
                <div className="mt-8">
                  <ReviewForm productId={product.id} />
                </div>
              </div>

              {/* Sidebar — sticky on desktop so the reassurance stays in view
                  while the shopper scrolls a long description. */}
              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-2xl border border-ink-200 bg-white p-5">
                  <h3 className="mb-3 text-[15px] font-bold text-ink-900">Delivery Information</h3>
                  <ul className="space-y-2.5 text-[13px] text-ink-600">
                    <li className="flex items-start gap-2">
                      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                      <span>Inside Dhaka: 1–2 days (৳60, free over ৳2,000)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                      <span>Outside Dhaka: 3–7 days (৳130–150)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                      <span>Cash on Delivery available nationwide</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                      <span>7-day return on unused items</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
                  <h3 className="mb-2 text-[15px] font-bold text-brand-900">Need help ordering?</h3>
                  <p className="text-[13px] leading-relaxed text-brand-800">
                    Call our hotline or message us on WhatsApp — we reply within minutes during business hours.
                  </p>
                  <a href={`tel:${config.phone}`} className="btn-bd btn-sm mt-3 w-full">{config.phone}</a>
                </div>

                <div className="rounded-2xl border border-ink-200 bg-white p-5">
                  <h3 className="mb-3 text-[15px] font-bold text-ink-900">Payment Options</h3>
                  {/* Same source as the footer grid, so the two never disagree.
                      Logos only — no brand name, colour swatch, caption or card. */}
                  {payments.length > 0 ? (
                    <ul className="grid grid-cols-3 items-center gap-x-3 gap-y-4">
                      {payments.map((m) => (
                        <li key={m.id} title={m.label} className="flex h-8 items-center justify-center">
                          <PaymentLogoImage
                            method={m}
                            className="max-h-8 max-w-full object-contain"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-ink-500">
                      Payment logos are uploaded in the admin panel.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-16 border-t border-ink-200 pt-10">
              <h2 className="mb-6 font-display text-xl font-bold text-ink-900 sm:text-2xl">You May Also Like</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {related.map((r) => (
                  <ProductCard key={r.id} product={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

import ProductGallery from '@/components/store/ProductGallery';
import ReviewForm from '@/components/store/ReviewForm';
