import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — forwards the current pathname to server components via a header
 * so `app/admin/layout.tsx` can decide whether to render the standalone login
 * page or the authenticated admin shell.
 *
 * Also sets a couple of defensive security headers on every response.
 */
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', req.nextUrl.pathname);
  requestHeaders.set('x-search', req.nextUrl.search);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Basic hardening (Next.js also sets some of these in next.config.js)
  res.headers.set('X-DNS-Prefetch-Control', 'on');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return res;
}

export const config = {
  // Skip static assets, images and the favicon for performance
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)'],
};
