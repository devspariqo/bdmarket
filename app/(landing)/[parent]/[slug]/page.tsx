import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { safeFirstImage } from '@/lib/cart';
import { parseBlocks, findCheckoutBlock, landingPath } from '@/lib/landing-blocks';
import LandingRenderer from '@/components/store/landing/LandingRenderer';

/**
 * A public landing page: `/<parentSlug>/<slug>`, e.g. `/collection/eid-panjabi`.
 *
 * Renders with no store header or footer — see `app/(landing)/layout.tsx`.
 *
 * Two things here are load-bearing and easy to get wrong:
 *
 * 1. **`dynamic = 'force-dynamic'`, and no `generateStaticParams`.** The page
 *    reads the database, counts a view and is editable at any moment from the
 *    admin, so it must never be prerendered. A prerendered route that touches a
 *    dynamic API builds fine and then 500s on a strict production runtime with
 *    DYNAMIC_SERVER_USAGE — which is exactly how `/product/[slug]` broke on
 *    Hostinger.
 *
 * 2. **`notFound()` rather than an empty page.** An unpublished or unknown slug
 *    must 404, or a draft becomes publicly reachable by guessing its URL.
 */

export const dynamic = 'force-dynamic';

type Params = { params: { parent: string; slug: string } };

async function loadPage(parent: string, slug: string) {
  try {
    return await prisma.landingPage.findFirst({
      // Slug is globally unique, but the parent is checked too so that a page
      // moved to a different parent 404s at its old address instead of quietly
      // still resolving.
      where: { slug, parentSlug: parent, status: 'published' },
    });
  } catch (err) {
    // A database that is down must render a 404, not a stack trace, on a page
    // that paid traffic is landing on.
    console.error('[landing] lookup failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await loadPage(params.parent, params.slug);
  if (!page) return { title: 'Page not found', robots: { index: false, follow: false } };

  const config = await getSiteConfig();
  const path = landingPath(page.parentSlug, page.slug);
  const title = page.metaTitle || page.title;
  const description = page.metaDesc || page.title;

  return {
    title,
    description,
    keywords: page.metaKeywords || undefined,
    alternates: { canonical: page.canonical || path },
    // A funnel page is usually a duplicate of the product it advertises and is
    // reached by paid traffic, so the merchant gets a switch to keep it out of
    // the index.
    robots: page.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'website',
      locale: 'en_BD',
      siteName: config.siteName,
      title,
      description,
      url: path,
      images: page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
    twitter: {
      card: page.ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: page.ogImage ? [page.ogImage] : undefined,
    },
  };
}

export default async function LandingPageRoute({ params }: Params) {
  const page = await loadPage(params.parent, params.slug);
  if (!page) notFound();

  const blocks = parseBlocks(page.blocks);

  // Only the products this page actually references. A landing page carries its
  // own products rather than querying the catalogue, so this stays a single
  // indexed lookup however large the store is.
  const productIds = Array.from(
    new Set(
      blocks
        .filter((b) => b.type === 'products')
        .flatMap((b) => (Array.isArray(b.props?.productIds) ? b.props.productIds : []))
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  const rows = productIds.length
    ? await prisma.product
        .findMany({
          where: { id: { in: productIds }, status: 'published' },
          select: {
            id: true, name: true, slug: true, price: true, comparePrice: true,
            images: true, stock: true,
          },
        })
        .catch(() => [])
    : [];

  // Preserve the order the merchant chose in the builder, not the database's.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const products = productIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      price: r.price,
      comparePrice: r.comparePrice ?? null,
      image: safeFirstImage(r.images),
      stock: r.stock,
    }));

  // Count the view. Best-effort: a failed counter must never fail the page.
  prisma.landingPage
    .update({ where: { id: page.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  const checkout = findCheckoutBlock(blocks);
  const checkoutEnabled = page.checkoutEnabled && !!checkout;

  const fontFamily = page.fontFamily?.trim();

  return (
    <>
      {/* Tracking. Per page rather than global: a funnel usually carries its own
          campaign pixel, and `next/script` keeps these out of the critical path. */}
      {page.gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(page.gaId)}`}
            strategy="afterInteractive"
          />
          <Script id={`ga-${page.id}`} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${page.gaId.replace(/'/g, "\\'")}');`}
          </Script>
        </>
      )}

      {page.fbPixelId && (
        <Script id={`fbq-${page.id}`} strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${page.fbPixelId.replace(/'/g, "\\'")}');fbq('track','PageView');`}
        </Script>
      )}

      {/* Raw head/body snippets the merchant pastes in, for anything the fields
          above do not cover. Admin-only input. */}
      {page.customHead && <div dangerouslySetInnerHTML={{ __html: page.customHead }} />}

      <main
        className="min-h-screen"
        style={{
          background: page.bgColor || '#ffffff',
          color: page.textColor || '#1c1917',
          fontFamily: fontFamily || undefined,
        }}
      >
        {blocks.length === 0 ? (
          <div className="mx-auto max-w-xl px-6 py-24 text-center">
            <h1 className="font-display text-2xl font-bold">{page.title}</h1>
            <p className="mt-3 text-[15px] opacity-70">
              This page has no content yet. Add blocks in the page builder and publish it.
            </p>
          </div>
        ) : (
          <LandingRenderer pageId={page.id} blocks={blocks} products={products} />
        )}

        {/* The merchant may hide the checkout block's form but still want the
            page; when it is switched off the visitor gets a way to reach the
            store rather than a dead end. */}
        {!checkoutEnabled && (
          <footer className="border-t border-black/10 px-6 py-8 text-center text-[13px] opacity-60">
            Questions? Contact us — details are on the main store.
          </footer>
        )}
      </main>

      {page.customBody && <div dangerouslySetInnerHTML={{ __html: page.customBody }} />}
    </>
  );
}
