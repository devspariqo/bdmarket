import type { MetadataRoute } from 'next';
import { getSetting, getSiteConfig } from '@/lib/settings';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getSiteConfig();
  const base = (config.siteUrl || 'http://localhost:3000').replace(/\/$/, '');

  // Allow the admin to override robots.txt entirely from Settings → SEO
  const custom = await getSetting('seo_robots_txt', '');
  const enabled = await getSetting('seo_sitemap_enabled', 'true');

  // Always protect the admin area, API, cart and account pages from indexing.
  const disallow = [
    '/admin',
    '/admin/',
    '/api/',
    '/cart',
    '/checkout',
    '/account',
    '/login',
    '/register',
    '/search',
    '/order/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      // Block aggressive SEO crawlers that rarely help a small store
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
    ],
    sitemap: enabled !== 'false' ? `${base}/sitemap.xml` : undefined,
    host: base,
  };
}
