'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, Loader2, Minus, Plus } from 'lucide-react';

export default function AddToCartButton({
  productId, slug, name, price, image, stock, variant, compact = false, qty = 1, fullWidth = false,
}: {
  productId: string;
  slug?: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  variant?: string | null;
  compact?: boolean;
  qty?: number;
  fullWidth?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const router = useRouter();

  async function add(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (stock <= 0 || state === 'loading') return;
    setState('loading');
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variant: variant || null, qty }),
      });
      if (!res.ok) throw new Error('failed');
      setState('done');
      router.refresh();
      setTimeout(() => setState('idle'), 1600);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  const disabled = stock <= 0;

  return (
    <button
      onClick={add}
      disabled={disabled || state === 'loading'}
      className={`${fullWidth ? 'w-full' : ''} ${
        compact ? 'btn btn-sm w-full rounded-lg' : 'btn-lg'
      } group/btn inline-flex items-center justify-center gap-2 font-semibold transition-all ${
        disabled
          ? 'cursor-not-allowed bg-ink-100 text-ink-400'
          : state === 'done'
          ? 'bg-emerald-600 text-white'
          : state === 'error'
          ? 'bg-rose-600 text-white'
          : 'bg-ink-900 text-white hover:bg-brand-700 active:scale-[.97]'
      }`}
      aria-label={`Add ${name} to cart`}
    >
      {disabled ? (
        'Out of Stock'
      ) : state === 'loading' ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className={compact ? 'text-[12px]' : ''}>Adding…</span>
        </>
      ) : state === 'done' ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span className={compact ? 'text-[12px]' : ''}>Added!</span>
        </>
      ) : state === 'error' ? (
        <span className={compact ? 'text-[12px]' : ''}>Try again</span>
      ) : (
        <>
          <ShoppingBag className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          <span className={compact ? 'text-[12px]' : ''}>Add to Cart</span>
        </>
      )}
    </button>
  );
}

export function QtySelector({
  value, onChange, max = 10, min = 1, size = 'md',
}: { value: number; onChange: (n: number) => void; max?: number; min?: number; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-8' : 'h-10';
  const btn = size === 'lg' ? 'w-12' : size === 'sm' ? 'w-8' : 'w-10';
  return (
    <div className={`inline-flex items-center rounded-xl border border-ink-200 bg-white ${box}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`flex ${btn} h-full items-center justify-center rounded-l-xl text-ink-600 transition hover:bg-ink-50 disabled:opacity-30`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={`flex min-w-[2.5rem] items-center justify-center text-[15px] font-bold ${size === 'lg' ? 'text-base' : ''}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`flex ${btn} h-full items-center justify-center rounded-r-xl text-ink-600 transition hover:bg-ink-50 disabled:opacity-30`}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
