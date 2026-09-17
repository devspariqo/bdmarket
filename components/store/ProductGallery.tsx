'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, X, ZoomIn } from 'lucide-react';
import { GALLERY_WIDTHS, THUMB_WIDTHS, imageAt, imagePreconnect, srcSetFor } from '@/lib/images';
import { cn } from '@/lib/utils';

/**
 * Product gallery: hover magnifier, and a lightbox that actually zooms.
 *
 * Three things shape this:
 *
 * 1. **Hover zoom follows the cursor** via `transform-origin`, so the magnified
 *    point stays under the pointer. It is disabled on touch and for anyone who
 *    has asked for reduced motion — a zoom that jumps around under a finger is
 *    worse than no zoom, and it fights the page's own pinch gesture.
 *
 * 2. **The lightbox zooms for real.** The previous version opened a static image
 *    at its natural size, so the "zoom" button revealed nothing a shopper could
 *    not already see. This one supports wheel, buttons, double-click and drag to
 *    pan — which is what the button promises.
 *
 * 3. **Images are sized by the host, not by Next.** `next/image` needs `sharp`,
 *    which is not a dependency here, so on a host without it the emitted `<img>`
 *    can end up larger than the original. `srcSetFor` asks Unsplash for the exact
 *    width instead, with `auto=format` for WebP/AVIF. Uploaded files are already
 *    downscaled in the browser before upload, so they pass through untouched.
 */

const HOVER_ZOOM = 2.4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function ProductGallery({
  images,
  name,
  discount = 0,
}: {
  images: string[];
  name: string;
  discount?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  // Hover magnifier
  const [canHover, setCanHover] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Lightbox
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const clean = images.filter(Boolean);
  const imgs = clean.length ? clean : [''];
  const current = imgs[idx];

  // Pointer capability, resolved after mount so the server render and the first
  // client render agree — `matchMedia` does not exist while rendering on the server.
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setCanHover(mq.matches && !reduce.matches);
    apply();
    mq.addEventListener('change', apply);
    reduce.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      reduce.removeEventListener('change', apply);
    };
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    dragStart.current = null;
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    resetView();
  }, [resetView]);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIdx((i) => (i + dir + imgs.length) % imgs.length);
      resetView();
      setLoading(true);
    },
    [imgs.length, resetView]
  );

  // Esc closes, arrows page, +/- zoom. Bound only while open so the rest of the
  // store's keyboard behaviour is untouched.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
      else if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(MIN_ZOOM, z - 0.5));
    };
    window.addEventListener('keydown', onKey);
    // The lightbox covers the page, so the page behind it must not scroll.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, go]);

  /** Stop the image being dragged completely out of view. */
  const clampOffset = (x: number, y: number, z: number) => {
    const limit = 50 * (z - 1);
    return {
      x: Math.max(-limit, Math.min(limit, x)),
      y: Math.max(-limit, Math.min(limit, y)),
    };
  };

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + (e.deltaY < 0 ? 0.4 : -0.4)));
    setZoom(next);
    setOffset((o) => clampOffset(o.x, o.y, next));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (zoom <= 1) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = ((e.clientX - dragStart.current.x) / window.innerWidth) * 100;
    const dy = ((e.clientY - dragStart.current.y) / window.innerHeight) * 100;
    setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
  }

  function endDrag() {
    setDragging(false);
    dragStart.current = null;
  }

  const preconnect = imagePreconnect(current);
  const mainSrcSet = srcSetFor(current, GALLERY_WIDTHS);
  const lightboxSrc = imageAt(current, 1600, 80);

  return (
    <div className="lg:sticky lg:top-32 lg:h-fit">
      {/* A cold TLS handshake to the image CDN can cost more than the first image
          itself. Starting it while the HTML is still parsing takes that off the
          critical path. Emitted here rather than in the root layout so a page with
          no remote images does not pay for it. */}
      {preconnect && <link rel="preconnect" href={preconnect} crossOrigin="anonymous" />}

      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
        <div
          className={cn('relative aspect-[4/5] w-full', canHover && current && 'cursor-zoom-in')}
          onMouseEnter={() => canHover && setHovering(true)}
          onMouseLeave={() => {
            setHovering(false);
            setOrigin({ x: 50, y: 50 });
          }}
          onMouseMove={(e) => {
            if (!canHover) return;
            const r = e.currentTarget.getBoundingClientRect();
            setOrigin({
              x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
              y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
            });
          }}
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageAt(current, 900)}
              srcSet={mainSrcSet}
              sizes="(min-width: 1024px) 46vw, 100vw"
              alt={`${name} — image ${idx + 1} of ${imgs.length}`}
              // The first image is this page's largest-contentful paint, so it
              // must not be deferred. Anything after it is off-screen.
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-150 ease-out will-change-transform"
              style={{
                transform: hovering ? `scale(${HOVER_ZOOM})` : 'none',
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-300">No image</div>
          )}
        </div>

        {discount > 0 && (
          <span className="pointer-events-none absolute left-4 top-4 rounded-lg bg-accent px-2.5 py-1 text-[13px] font-bold text-accent-on shadow">
            -{discount}%
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setLoading(true);
          }}
          className="absolute right-4 top-4 rounded-lg bg-white/90 p-2 text-ink-700 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label="Open the full-size image"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {imgs.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-ink-800 shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % imgs.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-ink-800 shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/60')}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails. Lazy loading matters most here: a product with eight images
          would otherwise fetch all eight before the shopper scrolls to them. */}
      {imgs.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {imgs.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                'h-18 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-18',
                i === idx ? 'border-brand-600' : 'border-ink-200 hover:border-ink-400'
              )}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageAt(img, 160, 60)}
                srcSet={srcSetFor(img, THUMB_WIDTHS, 60)}
                sizes="80px"
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {open && current && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — image ${idx + 1} of ${imgs.length}`}
          onClick={close}
        >
          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={() => {
              setZoom(zoom > 1 ? 1 : 2.5);
              setOffset({ x: 0, y: 0 });
            }}
            style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
          >
            {loading && (
              <span className="absolute inset-0 grid place-items-center text-white/70">
                <Loader2 className="h-7 w-7 animate-spin" />
              </span>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSrc}
              alt={`${name} — image ${idx + 1}`}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
              draggable={false}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out"
              style={{ transform: `scale(${zoom}) translate(${offset.x}%, ${offset.y}%)` }}
            />
          </div>

          {/* Controls. Wrapped so a click on a button does not also reach the
              backdrop handler and close the lightbox. */}
          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/10 px-2 py-1.5 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(MIN_ZOOM, zoom - 0.5);
                  setZoom(next);
                  setOffset((o) => clampOffset(o.x, o.y, next));
                }}
                disabled={zoom <= MIN_ZOOM}
                className="grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[52px] text-center text-[13px] font-bold tabular-nums text-white">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(MAX_ZOOM, zoom + 0.5);
                  setZoom(next);
                  setOffset((o) => clampOffset(o.x, o.y, next));
                }}
                disabled={zoom >= MAX_ZOOM}
                className="grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {imgs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <p className="absolute left-1/2 top-5 hidden -translate-x-1/2 text-[13px] text-white/70 sm:block">
              Scroll to zoom · drag to pan · double-click to reset
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
