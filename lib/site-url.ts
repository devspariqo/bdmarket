import { headers } from 'next/headers';
import { getAllSettings } from './settings';

/**
 * The site's canonical base URL, resolved rather than assumed.
 *
 * `sitemap.xml` and `robots.txt` must contain **absolute** URLs, and both used to
 * build them from the `site_url` setting alone. That setting ships as
 * `http://localhost:3000`, so a store that never changed it published a sitemap
 * full of `http://localhost:3000/...` and a robots.txt pointing crawlers at
 * `http://localhost:3000/sitemap.xml` — which is worse than no sitemap, because a
 * crawler that follows it indexes nothing and reports the whole site as broken.
 *
 * The order below means a deployment is correct with no configuration at all:
 *
 *  1. **`site_url`, when it is a real host.** This is the canonical choice and
 *     wins deliberately — a store reachable on several domains needs the sitemap
 *     to name the one it wants indexed, not whichever host happened to ask.
 *  2. **`NEXT_PUBLIC_SITE_URL`**, for a host that sets it at build time.
 *  3. **The host on the incoming request.** This is the "just works" case: the
 *     crawler asked for `https://shop.example.com/sitemap.xml`, so that is the
 *     origin the sitemap advertises. `x-forwarded-host` and `x-forwarded-proto`
 *     come first because a deployment behind a proxy (Hostinger included) sees the
 *     internal address otherwise, and would publish `http://127.0.0.1:3000`.
 *  4. Localhost, as a last resort for development.
 *
 * A localhost value is skipped in steps 1 and 2 rather than honoured, so the
 * shipped default cannot leak into production output.
 */
const LOCALHOST = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

function clean(value: unknown): string {
  return String(value ?? '').trim().replace(/\/+$/, '');
}

/** True when a URL points at the machine it is running on. */
export function isLocalhostUrl(url: string): boolean {
  return !url || LOCALHOST.test(url);
}

export async function resolveSiteUrl(): Promise<string> {
  let configured = '';
  try {
    const settings = await getAllSettings();
    configured = clean(settings.site_url);
  } catch {
    // A sitemap must still generate when the database is unreachable.
  }
  if (configured && !isLocalhostUrl(configured)) return configured;

  const fromEnv = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (fromEnv && !isLocalhostUrl(fromEnv)) return fromEnv;

  try {
    const h = headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    if (host) {
      const proto =
        h.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        (isLocalhostUrl(host) ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  } catch {
    // `headers()` throws outside a request scope (a build-time render, a script).
  }

  return configured || fromEnv || 'http://localhost:3000';
}
