import { getAllSettings } from './settings';

/**
 * The admin panel's URL path.
 *
 * Middleware serves the panel on this path and 404s `/admin` while it is set.
 * Everything that links into the panel must therefore build its hrefs from here,
 * or the merchant changes the path and the navigation breaks.
 *
 * **Obscurity, not security.** A hidden path keeps automated scanners — which
 * probe `/admin` and `/wp-admin` by the thousand — from finding the login form,
 * and keeps the panel out of the logs. It stops nobody who knows the path, so it
 * is never a substitute for a strong password. The settings screen says so too.
 */

/** The default, and what every fallback resolves to. */
export const DEFAULT_ADMIN_PATH = 'admin';

/**
 * A single clean URL segment.
 *
 * Deliberately strict: this value is spliced into a rewrite and into every admin
 * href, so anything with a slash, a dot, a query character or a percent-escape
 * could change which route is served. Only lowercase letters, digits and hyphens
 * survive, and reserved segments are rejected so the panel cannot be moved on top
 * of a real page — or onto `api`, which would take the whole app down.
 */
export function normaliseAdminPath(raw: unknown): string {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');

  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(value)) return DEFAULT_ADMIN_PATH;

  const reserved = new Set([
    'admin', 'api', 'uploads', 'product', 'products', 'category', 'categories',
    'brand', 'brands', 'cart', 'checkout', 'account', 'login', 'register',
    'search', 'shop', 'blog', 'pages', 'page', 'order', 'orders', 'track',
    'collection', 'wishlist', 'sitemap', 'robots', 'manifest', 'well-known',
    'static', 'public', 'assets', 'favicon',
  ]);
  if (reserved.has(value)) return DEFAULT_ADMIN_PATH;

  return value;
}

/**
 * The base path for admin links — `/admin`, or `/whatever-the-merchant-chose`.
 *
 * Safe to call from any server component: `getAllSettings` is cached and fails
 * soft, so this never throws and never blocks a render on the database.
 */
export async function getAdminBase(): Promise<string> {
  try {
    const settings = await getAllSettings();
    return `/${normaliseAdminPath(settings.admin_path)}`;
  } catch {
    return `/${DEFAULT_ADMIN_PATH}`;
  }
}

/** Build an href into the panel. `adminHref('/orders', '/panel')` → `/panel/orders`. */
export function adminHref(path: string, base: string): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${base}/${clean}` : base;
}
