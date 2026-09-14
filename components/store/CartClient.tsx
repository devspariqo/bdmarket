'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, Tag, X, ArrowRight, Truck, ShieldCheck, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { QtySelector } from './AddToCartButton';

type Item = {
  id: string; productId: string; slug: string; name: string; image: string;
  price: number; qty: number; variant: string | null; stock: number; maxQty: number; lineTotal: number;
};

export default function CartClient({
  items: initialItems, subtotal, discount, shipping, total, coupon, freeShippingOver,
}: {
  items: Item[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: { code: string; value: number; type: string; description?: string | null } | null;
  freeShippingOver: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [couponCode, setCouponCode] = useState(coupon?.code || '');
  const [appliedCoupon, setAppliedCoupon] = useState(coupon);
  const [busy, setBusy] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const sub = items.reduce((s, i) => s + i.price * i.qty, 0);

  let disc = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') disc = (sub * appliedCoupon.value) / 100;
    else if (appliedCoupon.type === 'fixed') disc = appliedCoupon.value;
    disc = Math.min(disc, sub);
  }

  const ship = appliedCoupon?.type === 'freeship' || sub - disc >= freeShippingOver ? 0 : shipping;
  const tot = Math.max(0, sub - disc + ship);
  const remaining = Math.max(0, freeShippingOver - (sub - disc));

  async function updateQty(itemId: string, qty: number) {
    setBusy(itemId);
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== itemId) : prev.map((i) => (i.id === itemId ? { ...i, qty } : i))
    );
    try {
      await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, qty }),
      });
      router.refresh();
    } catch {
      /* revert on next refresh */
    } finally {
      setBusy(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusy(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');
      setAppliedCoupon(data.coupon);
      setCouponMsg({ type: 'ok', text: `Coupon "${data.coupon.code}" applied!` });
      router.refresh();
    } catch (e: any) {
      setCouponMsg({ type: 'err', text: e.message });
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  }

  async function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMsg(null);
    await fetch('/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '' }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_370px]">
      {/* Items */}
      <div>
        {remaining > 0 ? (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-900">
              <Truck className="h-4 w-4" />
              Add {formatPrice(remaining)} more for FREE delivery!
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-amber-200">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, ((sub - disc) / freeShippingOver) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-semibold text-emerald-900">
            <Check className="h-4 w-4" /> Congratulations! You've qualified for FREE delivery.
          </div>
        )}

        <div className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-white">
          {items.map((it) => (
            <div key={it.id} className={`flex gap-3.5 p-4 transition sm:gap-4 ${busy === it.id ? 'opacity-50' : ''}`}>
              <Link href={`/product/${it.slug}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-50 sm:h-28 sm:w-24">
                {it.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/product/${it.slug}`} className="line-clamp-2 text-[15px] font-semibold text-ink-900 hover:text-brand-700">
                      {it.name}
                    </Link>
                    {it.variant && <p className="mt-1 text-[13px] text-ink-500">Size/Colour: {it.variant}</p>}
                    <p className="mt-1 text-[13px] text-ink-500">
                      {formatPrice(it.price)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${it.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QtySelector value={it.qty} onChange={(q) => updateQty(it.id, q)} max={it.maxQty} size="sm" />
                  <span className="text-base font-bold text-ink-900">{formatPrice(it.price * it.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/shop" className="text-[15px] font-semibold text-brand-700 hover:underline">← Continue shopping</Link>
          <Link href="/cart" className="text-[13px] text-ink-500 hover:text-ink-800">Recalculate</Link>
        </div>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-32 lg:h-fit">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900">Order Summary</h2>

          {/* Coupon */}
          <div className="mb-4 border-b border-ink-100 pb-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[13px] font-bold text-emerald-900">
                  <Tag className="h-3.5 w-3.5" /> {appliedCoupon.code}
                </span>
                <button onClick={removeCoupon} className="rounded p-1 text-emerald-700 hover:bg-emerald-100" aria-label="Remove coupon">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon} className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input py-2 text-[13px] uppercase"
                  aria-label="Coupon code"
                />
                <button type="submit" disabled={couponLoading || !couponCode} className="btn-dark btn-sm shrink-0">
                  {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                </button>
              </form>
            )}
            {couponMsg && (
              <p className={`mt-2 text-[12px] font-semibold ${couponMsg.type === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>
                {couponMsg.text}
              </p>
            )}
            {!appliedCoupon && !couponMsg && (
              <p className="mt-2 text-[12px] text-ink-400">
                Try <button type="button" onClick={() => setCouponCode('WELCOME10')} className="font-bold text-brand-700 underline">WELCOME10</button> for 10% off
              </p>
            )}
          </div>

          <dl className="space-y-2.5 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-semibold text-ink-900">{formatPrice(sub)}</dd>
            </div>
            {disc > 0 && (
              <div className="flex justify-between">
                <dt className="text-emerald-700">Discount</dt>
                <dd className="font-semibold text-emerald-700">−{formatPrice(disc)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery</dt>
              <dd className="font-semibold text-ink-900">
                {ship === 0 ? <span className="text-emerald-700">FREE</span> : formatPrice(ship)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-3 text-base">
              <dt className="font-bold text-ink-900">Total</dt>
              <dd className="font-display text-xl font-bold text-ink-900">{formatPrice(tot)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[12px] text-ink-400">Inclusive of all applicable taxes</p>

          <Link href="/checkout" className="btn-primary btn-lg mt-5 w-full">
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="mt-4 flex items-center justify-center gap-4 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Secure</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Fast Delivery</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-ink-200 bg-ink-50/60 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink-600">We Accept</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['bKash', 'Nagad', 'Rocket', 'Visa', 'Mastercard', 'COD'].map((m) => (
              <span key={m} className="rounded border border-ink-200 bg-white px-2 py-1 text-[12px] font-bold text-ink-600">{m}</span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
