import { getSetting } from '@/lib/settings';
import { resolveSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * `/robots.txt`.
 *
 * Served by a route handler rather than Next's `app/robots.ts` because that
 * returns a structured object, and the merchant can paste their own file into
 * Settings → SEO. That setting was being read and then thrown away — the file
 * ignored it entirely. Raw text is the only way to honour it.
 *
 * The `Sitemap:` line is always written from `resolveSiteUrl()`, so it names the
 * domain the crawler actually reached rather than whatever `site_url` happened to
 * hold. A wrong sitemap URL is worse than none: the crawler follows it, indexes
 * nothing, and treats the whole site as broken.
 */
export async function GET() {
  const base = await resolveSiteUrl();
  const sitemapUrl = `${base}/sitemap.xml`;

  const enabled = (await getSetting('seo_sitemap_enabled', 'true')) !== 'false';
  const custom = (await getSetting('seo_robots_txt', '')).trim();

  /**
   * Pages that must never be indexed.
   *
   * **The panel path is deliberately not listed.** robots.txt is public, so a
   * `Disallow: /bd-panel` would announce exactly where the panel moved to and
   * undo the point of moving it. `/admin` stays listed: it is the default, it
   * costs nothing, and it still applies if the merchant moves back. The real
   * protection is the `noindex` the admin layout sets on every one of its pages,
   * plus the fact that the moved path returns 404 to anyone who guesses wrong.
   */
  const disallow = [
    '/admin',
    '/api/',
    '/cart',
    '/checkout',
    '/account',
    '/login',
    '/register',
    '/search',
    '/order/',
  ];

  const generated = [
    'User-agent: *',
    'Allow: /',
    ...disallow.map((p) => `Disallow: ${p}`),
    '',
    '# Crawlers that hammer small stores without sending visitors',
    'User-agent: AhrefsBot',
    'Disallow: /',
    '',
    'User-agent: SemrushBot',
    'Disallow: /',
    '',
    'User-agent: MJ12bot',
    'Disallow: /',
    '',
    ...(enabled ? [`Sitemap: ${sitemapUrl}`] : []),
    `Host: ${base}`,
  ].join('\n');

  /**
   * With a custom file, the merchant's rules are kept verbatim — but any
   * `Sitemap:` line is rewritten. A pasted file almost always carries the URL of
   * whatever site it was copied from, or a localhost address saved during setup,
   * and that is precisely the thing that must be right.
   */
  let body = generated;
  if (custom) {
    const hasSitemap = /^\s*sitemap\s*:/im.test(custom);
    const withCorrectSitemap = hasSitemap
      ? custom.replace(/^\s*sitemap\s*:.*$/gim, '')
      : custom;
    const trimmed = withCorrectSitemap.replace(/\s+$/, '');
    body = enabled ? `${trimmed}\n\nSitemap: ${sitemapUrl}\n` : `${trimmed}\n`;
  }

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Cached for an hour, but stale-while-revalidate keeps a crawler from
      // waiting on a database read.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
