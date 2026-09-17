/**
 * Responsive image helpers.
 *
 * The store renders plain `<img>` rather than `next/image`, and that is
 * deliberate: image optimisation needs `sharp`, which is not a dependency here,
 * so on a host without it `next/image` falls back and the `<img>` it emits can
 * end up larger than the original — while still costing a client component and
 * an optimiser round trip.
 *
 * Instead the sizing is done by the *image host*, which is where it belongs.
 * Unsplash (which serves the seeded catalogue) accepts `w`, `q`, `fit` and
 * `auto=format` query parameters and will return a correctly sized WebP or AVIF.
 * A merchant's own uploads are already downscaled in the browser before they
 * reach the server, so they need nothing.
 *
 * Anything whose host is not known to support parameters is returned untouched —
 * appending `?w=` to a server that ignores it is harmless, but appending it to
 * one that treats unknown parameters as a cache key would defeat its CDN.
 */

/** Hosts that resize on request. Anything else is passed through unchanged. */
const RESIZING_HOSTS = ['images.unsplash.com', 'images.pexels.com'];

function canResize(url: string): boolean {
  try {
    const u = new URL(url);
    return RESIZING_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith('.' + h));
  } catch {
    // Relative URL — a local upload. Already sized at upload time.
    return false;
  }
}

/**
 * One URL at a given width, or the original if the host cannot resize.
 *
 * `auto=format` lets the CDN choose WebP/AVIF from the `Accept` header, which is
 * typically a 30–50% saving over the same JPEG with no markup change.
 */
export function imageAt(url: string, width: number, quality = 75): string {
  if (!url || !canResize(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(Math.round(width)));
    u.searchParams.set('q', String(quality));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * A `srcSet` string, or undefined when the host cannot resize.
 *
 * Returning undefined rather than a one-entry set matters: a `srcSet` with a
 * single candidate makes the browser ignore `sizes` and can pick a larger file
 * than the plain `src` would have.
 */
export function srcSetFor(url: string, widths: number[], quality = 75): string | undefined {
  if (!url || !canResize(url)) return undefined;
  return widths.map((w) => `${imageAt(url, w, quality)} ${w}w`).join(', ');
}

/** Widths that cover the slots this store actually renders. */
export const GALLERY_WIDTHS = [420, 640, 900, 1280];
export const THUMB_WIDTHS = [96, 160, 240];
export const CARD_WIDTHS = [220, 320, 480];

/**
 * The host to preconnect to, for a given image URL.
 *
 * A DNS + TLS handshake to the image CDN costs more than the first image itself
 * on a cold connection, and it can start while the HTML is still parsing.
 * Returns null for local uploads, which need no preconnect.
 */
export function imagePreconnect(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!canResize(url)) return null;
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }
}
