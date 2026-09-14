'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Truck, Loader2, Check, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { QtySelector } from './AddToCartButton';

type Variant = { id: string; size: string; color: string; price: number; stock: number; sku: string };

export default function ProductDetailClient({
  product,
}: {
  product: {
    id: string; name: string; slug: string; price: number; images: string[];
    stock: number; sku: string; sizes: string[]; colors: string[]; variants: Variant[]; maxQty: number;
  };
}) {
  const router = useRouter();
  const [size, setSize] = useState(product.sizes[0] || '');
  const [color, setColor] = useState(product.colors[0] || '');
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [buying, setBuying] = useState(false);
  const [err, setErr] = useState('');

  const selectedVariant =
    product.variants.find((v) => v.size === size && v.color === color) ||
    product.variants.find((v) => v.size === size) ||
    null;

  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const effectivePrice = selectedVariant?.price ?? product.price;
  const variantLabel = [size, color].filter(Boolean).join(' / ') || null;
  const disabled = effectiveStock <= 0;

  async function addToCart(thenCheckout = false) {
    if (disabled) return;
    setErr('');
    thenCheckout ? setBuying(true) : setState('loading');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, variant: variantLabel, qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (thenCheckout) {
        router.push('/checkout');
      } else {
        setState('done');
        router.refresh();
        setTimeout(() => setState('idle'), 1600);
      }
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
      setState('idle');
      setBuying(false);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Size */}
      {product.sizes.length > 0 && (
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-bold uppercase tracking-wide text-ink-700">Size</span>
            <button className="text-[12px] font-semibold text-brand-700 hover:underline">Size Guide</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const available = product.variants.some((v) => v.size === s && v.stock > 0);
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`relative min-w-[52px] rounded-xl border px-3.5 py-2.5 text-[15px] font-semibold transition ${
                    size === s
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : available
                      ? 'border-ink-200 bg-white text-ink-700 hover:border-ink-900'
                      : 'cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300'
                  }`}
                  disabled={!available && product.variants.length > 0}
                >
                  {s}
                  {!available && product.variants.length > 0 && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="h-px w-full rotate-[-20deg] bg-ink-300" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color */}
      {product.colors.length > 0 && (
        <div>
          <span className="mb-2.5 block text-[13px] font-bold uppercase tracking-wide text-ink-700">
            Colour: <span className="font-normal normal-case text-ink-600">{color}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition ${
                  color === c ? 'border-ink-900 bg-ink-50 text-ink-900' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400'
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-ink-200"
                  style={{ background: colorHex(c) }}
                />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Qty + buttons */}
      <div className="space-y-4 border-t border-ink-100 pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-ink-800">Quantity</span>
            <QtySelector value={qty} onChange={setQty} max={Math.min(effectiveStock || 1, 10)} />
          </div>
          {selectedVariant && (
            <span className="text-[13px] text-ink-400">SKU: {selectedVariant.sku}</span>
          )}
          {effectiveStock > 0 && effectiveStock <= 5 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[13px] font-bold text-amber-700">
              Only {effectiveStock} left
            </span>
          )}
        </div>

        {/* Primary actions — stacked full-width on phones, side-by-side from sm */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <button
            onClick={() => addToCart(false)}
            disabled={disabled || state === 'loading'}
            className={`inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl px-6 text-base font-bold shadow-sm transition-all duration-200 active:scale-[.98] ${
              disabled
                ? 'cursor-not-allowed bg-ink-100 text-ink-400 shadow-none'
                : state === 'done'
                ? 'bg-emerald-600 text-white'
                : 'bg-ink-900 text-white hover:bg-ink-800 hover:shadow-md'
            }`}
          >
            {state === 'loading' ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Adding…</>
            ) : state === 'done' ? (
              <><Check className="h-5 w-5" /> Added to Cart</>
            ) : (
              <><ShoppingBag className="h-5 w-5" /> Add to Cart</>
            )}
          </button>

          <button
            onClick={() => addToCart(true)}
            disabled={disabled || buying}
            className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 text-base font-bold text-white shadow-md shadow-brand-600/20 transition-all duration-200 hover:bg-brand-700 hover:shadow-lg active:scale-[.98] disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-400 disabled:shadow-none"
          >
            {buying ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</> : <><Zap className="h-5 w-5" /> Buy Now</>}
          </button>

          <button
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-ink-200 px-5 text-[15px] font-semibold text-ink-700 transition hover:border-ink-900 hover:bg-ink-50 active:scale-[.98] sm:flex-none sm:px-5"
            aria-label="Add to wishlist"
          >
            <Heart className="h-5 w-5" />
            <span className="sm:hidden">Add to Wishlist</span>
          </button>
        </div>

        {/* Reassurance under the buy buttons */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-brand-600" /> Cash on Delivery available
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-brand-600" /> 7-day easy returns
          </span>
        </div>

        {err && (
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-rose-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {err}
          </p>
        )}

        <p className="flex items-center gap-1.5 text-[12px] text-ink-500">
          <Truck className="h-3.5 w-3.5" />
          Order now and get it delivered in 1–2 days inside Dhaka
        </p>
      </div>
    </div>
  );
}

function colorHex(name: string) {
  const map: Record<string, string> = {
    white: '#ffffff', black: '#1a1a1a', navy: '#1e3a5f', maroon: '#7f1d1d', red: '#dc2626',
    blue: '#2563eb', 'sky blue': '#7dd3fc', sky: '#7dd3fc', green: '#16a34a', 'bottle green': '#065f46',
    emerald: '#059669', teal: '#0d9488', grey: '#6b7280', gray: '#6b7280', charcoal: '#374151',
    olive: '#65a30d', khaki: '#c3b091', brown: '#78350f', tan: '#d2a679', beige: '#e7d8c9',
    cream: '#fdf6e3', 'off white': '#f8f7f4', ivory: '#fffff0', gold: '#d4af37', 'rose gold': '#b76e79',
    pink: '#ec4899', peach: '#ffcba4', lavender: '#c4b5fd', mustard: '#d97706', rust: '#b45309',
    purple: '#7e22ce', wine: '#722f37', yellow: '#eab308', forest: '#166534', multi: 'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#60a5fa)',
    printed: 'linear-gradient(135deg,#f472b6,#facc15)', 'deep red': '#991b1b', 'deep maroon': '#5b1a1a',
    'royal blue': '#1d4ed8', 'pastel blue': '#bfdbfe', 'powder blue': '#b0e0e6', 'natural terracotta': '#c1633f',
    natural: '#d9c8a9',
  };
  return map[name.toLowerCase()] || '#cbd5e1';
}
