import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { UPLOAD_DIR } from '@/lib/uploads';

/**
 * GET /uploads/<filename>
 *
 * Why this route exists:
 * Next.js snapshots the `public/` directory when the production server boots.
 * A file written to `public/uploads/` at runtime — which is exactly what the admin
 * media uploader does — is therefore NOT served by the static handler and returns 404.
 *
 * Serving uploads through this handler instead of relying on `/public` static serving
 * makes uploaded media work identically in every environment:
 *   - local `next dev`
 *   - `next start` on a VPS / shared host
 *   - `output: 'standalone'`
 *   - behind a reverse proxy (Nginx / Apache)
 *
 * It also lets us set correct caching headers and block path-traversal attempts.
 *
 * The directory itself comes from `lib/uploads.ts` so the upload route and this
 * one can never disagree about where files live.
 */

/** Extensions we are willing to serve, mapped to their content type. */
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  const segments = params.path ?? [];

  // Reject any traversal attempt or nested path — uploads are always flat files.
  if (segments.length !== 1) {
    return new NextResponse('Not found', { status: 404 });
  }

  const name = segments[0];
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return new NextResponse('Bad request', { status: 400 });
  }

  const fullPath = path.join(UPLOAD_DIR, name);

  // Defence in depth: confirm the resolved path is still inside the upload dir.
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  const ext = path.extname(name).toLowerCase();
  if (!MIME[ext]) {
    return new NextResponse('Unsupported file type', { status: 415 });
  }

  let info;
  try {
    info = await stat(resolved);
    if (!info.isFile()) return new NextResponse('Not found', { status: 404 });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const headers = new Headers({
    'Content-Type': MIME[ext],
    'Content-Length': String(info.size),
    // Filenames are timestamped and immutable, so cache aggressively.
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });

  // SVG can carry script — never let a browser execute an uploaded SVG inline.
  if (ext === '.svg') {
    headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }

  const nodeStream = createReadStream(resolved);
  return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
    status: 200,
    headers,
  });
}
