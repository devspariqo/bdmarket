'use client';

import { useState } from 'react';
import { AlertCircle, Check, Loader2, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { BD_DISTRICTS, BD_DIVISIONS, cn, formatPrice } from '@/lib/utils';

export type LandingProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  image: string;
  stock: number;
};

type Values = Record<string, string>;

/**
 * The order form embedded in a landing page.
 *
 * Deliberately not the cart checkout. A funnel page exists to convert one
 * visitor into one order, so this collects the minimum needed to deliver and
 * posts straight to `/api/landing-order` — no cart, no login, no navigation away
 * from the page. Every extra step is a place to lose the sale.
 *
 * Required fields come from the block config, and the server re-validates the
 * same list. Client-side checks are for feedback, not for trust.
 */
export default function LandingCheckout({
  pageId,
  heading,
  subheading,
  buttonLabel,
  successText,
  fields,
  required,
  products,
  defaultProductId,
}: {
  pageId: string;
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
  successText?: string;
  fields: string[];
  required: string[];
  products: LandingProduct[];
  defaultProductId?: string;
}) {
  const shown = Array.isArray(fields) && fields.length ? fields : ['customerName', 'phone', 'district', 'street'];
  const needs = Array.isArray(required) ? required : ['customerName', 'phone', 'district', 'street'];

  const [values, setValues] = useState<Values>({
    customerName: '',
    phone: '',
    email: '',
    division: 'Dhaka',
    district: 'Dhaka',
    area: '',
    street: '',
    postcode: '',
    customerNote: '',
  });
  const [productId, setProductId] = useState(defaultProductId || products[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [errors, setErrors] = useState<Values>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ orderNumber: string } | null>(null);
  const [err, setErr] = useState('');

  const product = products.find((p) => p.id === productId) || products[0];
  const districts = BD_DISTRICTS[values.division] || [];

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const e: Values = {};
    for (const key of needs) {
      const v = String(values[key] || '').trim();
      if (!v) {
        e[key] = 'This field is required';
        continue;
      }
      if (key === 'phone' && !/^(\+?880|0)?1[3-9]\d{8}$/.test(v.replace(/[\s-]/g, ''))) {
        e.phone = 'Enter a valid mobile number, e.g. 01712345678';
      }
      if (key === 'email' && !/^\S+@\S+\.\S+$/.test(v)) {
        e.email = 'Enter a valid email address';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setErr('');
    if (!validate()) return;
    if (!product) {
      setErr('This page has no product attached. Add one in the page builder.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/landing-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, productId: product.id, qty, ...values }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Field-level errors from the server land in `errors`.
        if (data?.errors) setErrors(data.errors);
        throw new Error(data?.error || 'We could not place the order. Please try again.');
      }
      setDone({ orderNumber: data.orderNumber });
    } catch (e: any) {
      setErr(e?.message || 'We could not place the order. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div id="order" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <Check className="h-6 w-6" />
        </span>
        <h3 className="mt-3 font-display text-xl font-bold text-emerald-900">Order received</h3>
        <p className="mt-1 text-[15px] text-emerald-800">
          {successText || 'Thank you! We have received your order and will call you shortly.'}
        </p>
        <p className="mt-3 font-mono text-[14px] font-bold text-emerald-900">{done.orderNumber}</p>
        <p className="mt-1 text-[13px] text-emerald-700">
          Keep this number — we will quote it when we call.
        </p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div id="order" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-[14px] text-amber-900">
        This checkout block has no product attached yet. Add one in the page builder.
      </div>
    );
  }

  const input = 'h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

  return (
    <div id="order" className="mx-auto w-full max-w-xl">
      <form onSubmit={submit} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm sm:p-6">
        {heading && <h3 className="font-display text-xl font-bold text-ink-900">{heading}</h3>}
        {subheading && <p className="mt-1 text-[14px] text-ink-500">{subheading}</p>}

        {/* Product + quantity. Shown even for a single product: it confirms what
            the visitor is buying right where they commit. */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-200 p-3">
          {product?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <span className="h-14 w-14 rounded-lg bg-ink-100" />
          )}
          <div className="min-w-0 flex-1">
            {products.length > 1 ? (
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="h-9 w-full rounded-lg border border-ink-200 px-2 text-[14px]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatPrice(p.price)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="truncate text-[14px] font-semibold text-ink-900">{product?.name}</p>
            )}
            <p className="mt-0.5 text-[15px] font-bold text-ink-900">
              {product ? formatPrice(product.price * qty) : ''}
              {product?.comparePrice && product.comparePrice > product.price && (
                <span className="ml-2 text-[13px] font-normal text-ink-400 line-through">
                  {formatPrice(product.comparePrice * qty)}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50" aria-label="Decrease quantity">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-[15px] font-bold tabular-nums">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50" aria-label="Increase quantity">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {shown.includes('customerName') && (
            <label className="sm:col-span-2">
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">
                Full name{needs.includes('customerName') && <span className="text-rose-500"> *</span>}
              </span>
              <input value={values.customerName} onChange={(e) => set('customerName', e.target.value)} className={input} placeholder="Your name" autoComplete="name" />
              {errors.customerName && <span className="mt-1 block text-[12px] text-rose-600">{errors.customerName}</span>}
            </label>
          )}

          {shown.includes('phone') && (
            <label>
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">
                Mobile number{needs.includes('phone') && <span className="text-rose-500"> *</span>}
              </span>
              <input value={values.phone} onChange={(e) => set('phone', e.target.value)} className={input} placeholder="01712345678" inputMode="tel" autoComplete="tel" />
              {errors.phone && <span className="mt-1 block text-[12px] text-rose-600">{errors.phone}</span>}
            </label>
          )}

          {shown.includes('email') && (
            <label>
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">
                Email{needs.includes('email') && <span className="text-rose-500"> *</span>}
              </span>
              <input value={values.email} onChange={(e) => set('email', e.target.value)} className={input} placeholder="you@example.com" inputMode="email" autoComplete="email" />
              {errors.email && <span className="mt-1 block text-[12px] text-rose-600">{errors.email}</span>}
            </label>
          )}

          {shown.includes('division') && (
            <label>
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">
                Division{needs.includes('division') && <span className="text-rose-500"> *</span>}
              </span>
              <select
                value={values.division}
                onChange={(e) => {
                  set('division', e.target.value);
                  // Districts are per-division; keeping a stale one would submit a
                  // district that does not belong to the chosen division.
                  set('district', (BD_DISTRICTS[e.target.value] || [])[0] || '');
                }}
                className={input}
              >
                {BD_DIVISIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.division && <span className="mt-1 block text-[12px] text-rose-600">{errors.division}</span>}
            </label>
          )}

          {shown.includes('district') && (
            <label>
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">
                District{needs.includes('district') && <span className="text-rose-500"> *</span>}
              </span>
              <select value={values.district} onChange={(e) => set('district', e.target.value)} className={input}>
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.district && <span className="mt-1 block text-[12px] text-rose-600">{errors.district}</span>}
            </label>
          )}

          {shown.includes('area') && (
            <label>
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">Area</span>
              <input value={values.area} onChange={(e) => set('area', e.target.value)} className={input} placeholder="Area or thana" />
            </label>
          )}

          {shown.includes('street') && (
            <label className="sm:col-span-2">
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">
                Address{needs.includes('street') && <span className="text-rose-500"> *</span>}
              </span>
              <input value={values.street} onChange={(e) => set('street', e.target.value)} className={input} placeholder="House, road, landmark" autoComplete="street-address" />
              {errors.street && <span className="mt-1 block text-[12px] text-rose-600">{errors.street}</span>}
            </label>
          )}

          {shown.includes('postcode') && (
            <label>
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">Postcode</span>
              <input value={values.postcode} onChange={(e) => set('postcode', e.target.value)} className={input} inputMode="numeric" />
            </label>
          )}

          {shown.includes('customerNote') && (
            <label className="sm:col-span-2">
              <span className="mb-1 block text-[13px] font-semibold text-ink-700">Order note</span>
              <textarea
                value={values.customerNote}
                onChange={(e) => set('customerNote', e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Anything we should know?"
              />
            </label>
          )}
        </div>

        {err && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[14px] text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            'mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[16px] font-bold text-white transition',
            busy ? 'bg-ink-400' : 'bg-brand-600 hover:bg-brand-700'
          )}
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {busy ? 'Placing your order…' : buttonLabel || 'Place order'}
        </button>

        <div className="mt-3 flex items-center justify-center gap-4 text-[12px] text-ink-500">
          <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Cash on delivery</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> No advance payment</span>
        </div>
      </form>
    </div>
  );
}
