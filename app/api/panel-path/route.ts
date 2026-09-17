import { NextResponse } from 'next/server';
import { getAllSettings } from '@/lib/settings';
import { normaliseAdminPath } from '@/lib/admin-path';

export const dynamic = 'force-dynamic';

/**
 * Resolves the admin panel's URL path, for middleware.
 *
 * Middleware runs in the Edge runtime and cannot use Prisma, so it cannot read
 * the setting itself. It calls this instead — and this endpoint must therefore
 * not hand the path to anyone who asks, or the obscurity it provides would be
 * defeated by a single request.
 *
 * The gate is `AUTH_SECRET`, which is server-only and already required by the
 * app: middleware sends it as a header, and anything else gets the default back.
 * A missing `AUTH_SECRET` also returns the default rather than leaking, so a
 * misconfigured deployment fails closed.
 */
export async function GET(req: Request) {
  const secret = process.env.AUTH_SECRET || '';
  const supplied = req.headers.get('x-panel-token') || '';

  // A timing oracle on a static string buys an attacker nothing here, so a plain
  // comparison is enough.
  if (!secret || supplied !== secret) {
    return NextResponse.json({ path: 'admin' });
  }

  try {
    const settings = await getAllSettings();
    return NextResponse.json({ path: normaliseAdminPath(settings.admin_path) });
  } catch {
    // Never break routing because the database is briefly unavailable.
    return NextResponse.json({ path: 'admin' });
  }
}

