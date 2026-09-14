/**
 * Icon / favicon MIME helpers.
 *
 * The admin uploads the favicon through Settings → General, so the file can be
 * a PNG, WebP, JPEG or SVG. The declared `type` on `<link rel="icon">` has to
 * match the real file or browsers ignore the tag — which is exactly the bug
 * that made uploaded favicons appear not to work (a PNG was being announced as
 * `image/svg+xml`).
 */

const MIME_BY_EXT: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  avif: 'image/avif',
  ico: 'image/x-icon',
};

/** Best-effort MIME type for an icon path or URL. Defaults to SVG. */
export function mimeForIcon(path: string | null | undefined): string {
  if (!path) return 'image/svg+xml';

  // Strip any query/hash, then take the extension.
  const clean = path.split(/[?#]/)[0];
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return 'image/svg+xml';

  const ext = clean.slice(dot + 1).toLowerCase();
  return MIME_BY_EXT[ext] || 'image/svg+xml';
}
