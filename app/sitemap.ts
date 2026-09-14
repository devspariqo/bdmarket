import type { MetadataRoute } from 'next';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';

const STATIC_PATHS: { path: string; priority: number; freq: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
  { path: '', priority: 1, freq: 'daily' },
  { path: '/shop', priority: 0.9, freq: 'daily' },
  { path: '/brands', priority: 0.7, freq: 'weekly' },
  { path: '/blog', priority: 0.7, freq: 'weekly' },
  { path: '/cart', priority: 0.3, freq: 'monthly' },
  { path: '/pages/track-order', priority: 0.5, freq: 'monthly' },
  { path: '/login', priority: 0.2, freq: 'yearly' },
  { path: '/register', priority: 0.2, freq: 'yearly' },
];

/**
 * Sitemap, generated at build time.
 *
 * The database queries are wrapped in a try/catch so a build on a host where the
 * database is not reachable yet still produces a valid sitemap containing the
 * static routes, rather than failing the whole deployment. The crawler-visible
 * result is simply a smaller sitemap; it is regenerated with the full set once
 * the database is available at runtime (`revalidate` below).
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getSiteConfig();
  const base = (config.siteUrl || 'http://localhost:3000').replace(/\/$/, '');

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((s) => ({
    url: `${base}${s.path}`,
    lastModified: new Date(),
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];
  let brands: { slug: string }[] = [];
  let posts: { slug: string; updatedAt: Date }[] = [];
  let pages: { slug: string; updatedAt: Date }[] = [];

  try {
    [products, categories, brands, posts, pages] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
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
    ]);
  } catch (err) {
    console.warn(
      '[sitemap] database unavailable, emitting static routes only:',
      err instanceof Error ? err.message : err
    );
  }

  return [
    ...staticEntries,
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
      lastModified: new Date(),
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
  ];
}
