import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — forwards the current pathname to server components via a header
 * so `app/admin/layout.tsx` can decide whether to render the standalone login
 * page or the authenticated admin shell.
 *
 * It also serves the admin panel on a merchant-chosen path (Settings → Advanced →
 * Admin Panel URL). The real route stays at `/admin`; a request to the custom path
 * is rewritten to it, and `/admin` itself returns 404 while a custom path is set.
 *
 * **This is obscurity, not security.** It stops automated scanners — which probe
 * `/admin`, `/wp-admin` and the rest — from finding the login form, and keeps the
 * panel out of the logs. It does not stop anyone who knows the path, so it is
 * never a substitute for a strong password. The settings screen says so as well.
 *
 * The path is resolved over HTTP because middleware runs in the Edge runtime and
 * cannot use Prisma. It is cached briefly: the value changes about once in a
 * store's lifetime, and an uncached lookup would add a round trip to every request
 * in the store, not just the admin.
 */
/**
 * How long a resolved path may be reused.
 *
 * This was 30 seconds, and that was the bug behind "changing the panel URL does
 * not work". The merchant saves a new path; the panel's own links rebuild from the
 * setting immediately, but middleware kept serving the *old* path for half a
 * minute — so the new path 404'd, `/admin` still answered, and every link inside
 * the panel was broken until the cache expired. Measured: immediately after
 * saving, `/admin/...` returned 307 while `/bd-panel/...` returned 404, and the
 * two only swapped once the window had passed.
 *
 * A one-second window keeps the benefit that matters — a single page load fires
 * many requests (the RSC payload, prefetches, images) and they share one lookup —
 * while making the staleness shorter than the time it takes to save and click
 * something. `/api/panel-path` reads the app's own settings cache, which a save
 * invalidates, so the value it returns is already fresh; only this window stands
 * between the save and the new path working.
 */
const CACHE_MS = 1_000;
let cachedPath = 'admin';
let cachedAt = 0;
/** The resolution in flight, so concurrent requests share it. */
let resolving: Promise<string> | null = null;

async function panelPath(origin: string): Promise<string> {
  if (Date.now() - cachedAt < CACHE_MS) return cachedPath;
  if (resolving) return resolving;

  resolving = (async () => {
    try {
      const res = await fetch(`${origin}/api/panel-path`, {
        cache: 'no-store',
        headers: { 'x-panel-token': process.env.AUTH_SECRET || '' },
      });
      const data = await res.json();
      if (typeof data?.path === 'string' && data.path) cachedPath = data.path;
    } catch {
      // Keep the last known value. A blip must not snap the panel back to /admin
      // and expose it, nor 404 the path the merchant is actually using.
    } finally {
      // Set the timestamp only once the value is settled, so a failed lookup is
      // retried rather than cached for the full window.
      cachedAt = Date.now();
      resolving = null;
    }
    return cachedPath;
  })();

  return resolving;
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  /**
   * The resolver must not resolve itself.
   *
   * `panelPath` calls this app over HTTP, and that request runs middleware too —
   * so without this the middleware asked itself for the path, which asked itself
   * again, and so on. The recursion eventually gave up and left the cached value
   * at the default, which meant a custom path 404'd and the login page could not
   * be reached at all: exactly the symptom this fixes.
   */
  if (pathname === '/api/panel-path') {
    return NextResponse.next();
  }

  const custom = await panelPath(origin);

  if (custom !== 'admin') {
    const first = pathname.split('/')[1];

    // 1. The custom path serves the panel.
    if (first === custom) {
      /**
       * `slice` keeps the separating slash — `/bd-panel/login`.slice(9) is
       * `/login`, not `login` — so it has to be stripped before being joined, or
       * the target becomes `/admin//login` and Next matches no route. A rewrite
       * to a non-existent path returns 404 with no explanation, which is exactly
       * how this failed the first time.
       */
      const rest = pathname.slice(custom.length + 1).replace(/^\/+/, '');
      const target = `/admin${rest ? `/${rest}` : ''}`;
      const url = req.nextUrl.clone();
      url.pathname = target;
      const rewritten = NextResponse.rewrite(url, {
        request: { headers: withPathHeaders(req, pathname) },
      });
      applySecurityHeaders(rewritten);
      return rewritten;
    }

    /**
     * 2. The default path stops existing.
     *
     * A 404 rather than a redirect: a redirect would answer a scanner's probe with
     * the real location, which gives the whole thing away.
     */
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const res = new NextResponse('Not Found', { status: 404 });
      applySecurityHeaders(res);
      return res;
    }
  }

  const res = NextResponse.next({ request: { headers: withPathHeaders(req, pathname) } });
  applySecurityHeaders(res);
  return res;
}

/** The pathname and search, for server components that branch on the route. */
function withPathHeaders(req: NextRequest, pathname: string) {
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  headers.set('x-search', req.nextUrl.search);
  return headers;
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
}

export const config = {
  // Skip static assets, images and the favicon for performance
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)'],
};
