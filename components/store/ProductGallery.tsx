'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';

export default function ProductGallery({
  images, name, discount = 0,
}: { images: string[]; name: string; discount?: number }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const imgs = images.length ? images : [''];

  return (
    <div className="lg:sticky lg:top-32 lg:h-fit">
      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
        <div className="relative aspect-[4/5] w-full">
          {imgs[idx] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgs[idx]}
              alt={`${name} — image ${idx + 1}`}
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-ink-300">No image</div>
          )}
        </div>

        {discount > 0 && (
          <span className="absolute left-4 top-4 rounded-lg bg-accent px-2.5 py-1 text-[13px] font-bold text-accent-on shadow">
            -{discount}%
          </span>
        )}

        <button
          onClick={() => setZoom(true)}
          className="absolute right-4 top-4 rounded-lg bg-white/90 p-2 text-ink-700 shadow-sm backdrop-blur transition hover:bg-white"
          aria-label="Zoom image"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-ink-800 shadow-sm backdrop-blur transition hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
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
                  onClick={() => setIdx(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-18 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-18 ${
                i === idx ? 'border-brand-600' : 'border-ink-200 hover:border-ink-400'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom overlay */}
      {zoom && imgs[idx] && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/95 p-4" onClick={() => setZoom(false)}>
          <button
            onClick={() => setZoom(false)}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Close zoom"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgs[idx]} alt={name} className="max-h-[92vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
