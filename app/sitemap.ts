import type { MetadataRoute } from 'next';
import prisma from '@/lib/db';
import { resolveSiteUrl } from '@/lib/site-url';
import { landingPath } from '@/lib/landing-blocks';

/**
 * Sitemap.
 *
 * Two things this has to get right, both of which it previously got wrong:
 *
 * 1. **Absolute URLs on the real domain.** Built from `resolveSiteUrl()`, which
 *    falls back to the host on the incoming request — so a deployment publishes
 *    its own domain without anyone having to set `site_url` first.
 *
 * 2. **Every public page, from one list.** `PUBLIC_ROUTES` is the single source
 *    for the fixed pages, so adding a route and forgetting the sitemap is a
 *    one-line change in one place. Everything backed by a table is queried below,
 *    including landing pages, which were missing entirely.
 *
 * Private and duplicate surfaces are deliberately absent: `/cart`, `/checkout`,
 * `/account/*`, `/login`, `/register`, `/order/*` and `/search` are either
 * personal, transient or disallowed in robots.txt. A sitemap that lists a page
 * which cannot be indexed is a signal to a crawler that the file is unreliable.
 */

/** Fixed routes that should be indexed. */
const PUBLIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}[] = [
  { path: '', priority: 1.0, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/brands', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/track', priority: 0.5, changeFrequency: 'monthly' },
];

/**
 * A sitemap file may hold 50,000 URLs. This is a guard, not a limit: a catalogue
 * that large needs `generateSitemaps()` to emit an index instead, and silently
 * producing an invalid file would be worse than a short one.
 */
const MAX_URLS = 45_000;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await resolveSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];
  let brands: { slug: string }[] = [];
  let posts: { slug: string; updatedAt: Date }[] = [];
  let pages: { slug: string; updatedAt: Date }[] = [];
  let landings: { slug: string; parentSlug: string; updatedAt: Date }[] = [];

  try {
    [products, categories, brands, posts, pages, landings] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { status: 'active' },
        select: { slug: true, updatedAt: true },
      }),
      prisma.brand.findMany({
        where: { status: 'active' },
        select: { slug: true },
      }),
      prisma.post.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
      }),
      prisma.page.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
      }),
      /**
       * Landing pages, unless the merchant marked them `noIndex`.
       *
       * That flag is the whole reason it exists: a page built for a paid campaign
       * should not turn up in organic search and compete with the store's own
       * category pages. It is respected here rather than ignored.
       */
      prisma.landingPage.findMany({
        where: { status: 'published', noIndex: false },
        select: { slug: true, parentSlug: true, updatedAt: true },
      }),
    ]);
  } catch (err) {
    // A build on a host where the database is not reachable yet must still emit a
    // valid file rather than failing the deployment. It is regenerated with the
    // full set once the database is available.
    console.warn(
      '[sitemap] database unavailable, emitting static routes only:',
      err instanceof Error ? err.message : err
    );
  }

  entries.push(
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
    ...brands.map((b) => ({
      url: `${base}/brand/${b.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...pages.map((p) => ({
      url: `${base}/pages/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    ...landings.map((l) => ({
      url: `${base}${landingPath(l.parentSlug, l.slug)}`,
      lastModified: l.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  );

  if (entries.length > MAX_URLS) {
    console.warn(
      `[sitemap] ${entries.length} URLs exceeds the ${MAX_URLS} this file emits; ` +
        `switch to generateSitemaps() to serve an index. Truncating so the file stays valid.`
    );
    return entries.slice(0, MAX_URLS);
  }

  return entries;
}
