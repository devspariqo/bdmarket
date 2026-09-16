'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2, Lock, Check, ChevronRight, Truck, MapPin, CreditCard, Tag, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { formatPrice, BD_DIVISIONS, BD_DISTRICTS, cn } from '@/lib/utils';

type Item = {
  id: string; slug: string; name: string; image: string; price: number; qty: number; variant: string | null;
};
type PM = {
  code: string; name: string; nameBn: string | null; description: string | null;
  icon: string | null; instructions: string | null; fee: number; isSandbox: boolean;
};
type Zone = { name: string; districts: string; rate: number; freeOver: number | null; minDays: number; maxDays: number };

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric' | 'decimal' | 'url' | 'search';
  autoComplete?: string;
  rows?: number;
};

/**
 * One labelled checkout input.
 *
 * Declared at module scope on purpose. This used to live *inside* the
 * `CheckoutClient` function body, which means React saw a brand-new component
 * type on every render — so each keystroke unmounted and remounted the `<input>`
 * and the field lost focus after a single character. A component defined outside
 * the render keeps a stable identity, so the DOM node survives re-renders.
 */
function Field({
  id, label, value, onChange, error, type = 'text', placeholder,
  required = true, hint, inputMode, autoComplete, rows,
}: FieldProps) {
  const cls = cn('input', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20');
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
          aria-invalid={!!error}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cls}
          aria-invalid={!!error}
        />
      )}
      {hint && !error && <p className="mt-1 text-[12px] text-ink-400">{hint}</p>}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-rose-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutClient({
  items, summary, paymentMethods, zones, customer, savedAddress, freeShippingOver, guestCheckout,
}: {
  items: Item[];
  summary: { subtotal: number; discount: number; shipping: number; total: number; coupon: any };
  paymentMethods: PM[];
  zones: Zone[];
  customer: { name: string; email: string; phone: string } | null;
  savedAddress: { division: string; district: string; area: string; street: string; postcode: string } | null;
  freeShippingOver: number;
  guestCheckout: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    customerName: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    division: savedAddress?.division || 'Dhaka',
    district: savedAddress?.district || 'Dhaka',
    area: savedAddress?.area || '',
    street: savedAddress?.street || '',
    postcode: savedAddress?.postcode || '',
    customerNote: '',
    terms: false,
  });
  const [payment, setPayment] = useState('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const districts = BD_DISTRICTS[form.division] || [];

  // Resolve shipping
  const shipping = useMemo(() => {
    const zone = zones.find((z) => z.districts === 'ALL' || z.districts.includes(form.district));
    const rate = zone?.rate ?? 100;
    const freeOver = zone?.freeOver ?? freeShippingOver;
    const net = summary.subtotal - summary.discount;
    if (freeOver > 0 && net >= freeOver) return { cost: 0, label: 'FREE', days: zone ? `${zone.minDays}–${zone.maxDays}` : '2–5' };
    return { cost: rate, label: formatPrice(rate), days: zone ? `${zone.minDays}–${zone.maxDays}` : '2–5', zone: zone?.name };
  }, [form.district, zones, summary.subtotal, summary.discount, freeShippingOver]);

  const codFee = payment === 'cod' ? 0 : 0;
  const total = Math.max(0, summary.subtotal - summary.discount + shipping.cost + codFee);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: '' }));
  }

  function validateInfo() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(form.phone.replace(/[\s-]/g, '')))
      e.phone = 'Enter a valid BD mobile number (e.g. 01712345678)';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.district) e.district = 'Please select a district';
    if (!form.street.trim()) e.street = 'Street address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goToPayment() {
    if (validateInfo()) setStep(2);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function placeOrder() {
    setServerError('');
    if (!form.terms) {
      setServerError('Please accept the Terms & Conditions to place your order.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          division: form.division,
          district: form.district,
          area: form.area,
          street: form.street,
          postcode: form.postcode,
          paymentMethod: payment,
          customerNote: form.customerNote,
          couponCode: summary.coupon?.code || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error || 'Failed to place order');
      }
      router.push(data.redirect);
    } catch (e: any) {
      setServerError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
      {/* LEFT */}
      <div>
        {/* Steps indicator */}
        <ol className="mb-7 flex items-center gap-2 text-[13px] font-semibold">
          {[
            { n: 1, l: 'Delivery Info' },
            { n: 2, l: 'Payment' },
          ].map((s, i) => (
            <li key={s.n} className="flex items-center gap-2">
              <button
                onClick={() => s.n === 1 && setStep(1)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition',
                  step >= s.n ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-500'
                )}
              >
                {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
              </button>
              <span className={step >= s.n ? 'text-ink-900' : 'text-ink-400'}>{s.l}</span>
              {i === 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-300" />}
            </li>
          ))}
        </ol>

        {serverError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[13px] font-semibold text-rose-800">{serverError}</p>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-5">
            {/* Contact */}
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <MapPin className="h-4.5 w-4.5 text-brand-600" /> Contact & Delivery Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="customerName" label="Full Name" value={form.customerName}
                  onChange={(v: string) => set('customerName', v)} error={errors.customerName}
                  placeholder="Rahim Ahmed"
                />
                <Field
                  id="phone" label="Mobile Number" value={form.phone} type="tel" inputMode="tel"
                  onChange={(v: string) => set('phone', v)} error={errors.phone}
                  placeholder="01712345678" hint="We'll call to confirm your order"
                />
              </div>

              <div className="mt-4">
                <Field
                  id="email" label="Email Address" value={form.email} type="email"
                  onChange={(v: string) => set('email', v)} error={errors.email}
                  placeholder="you@example.com" hint="Order confirmation will be sent here"
                />
              </div>
            </section>

            {/* Address */}
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <Truck className="h-4.5 w-4.5 text-brand-600" /> Shipping Address
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="division" className="label">Division <span className="text-rose-500">*</span></label>
                  <select
                    id="division" value={form.division}
                    onChange={(e) => { set('division', e.target.value); set('district', BD_DISTRICTS[e.target.value]?.[0] || ''); }}
                    className="select"
                  >
                    {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className="label">District <span className="text-rose-500">*</span></label>
                  <select
                    id="district" value={form.district}
                    onChange={(e) => set('district', e.target.value)}
                    className={cn('select', errors.district && 'border-rose-400')}
                  >
                    <option value="">Select district</option>
                    {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.district && <p className="mt-1 text-[12px] font-semibold text-rose-600">{errors.district}</p>}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  id="area" label="Area / Thana" value={form.area} required={false}
                  onChange={(v: string) => set('area', v)} placeholder="Dhanmondi, Mirpur…"
                />
                <Field
                  id="postcode" label="Post Code" value={form.postcode} required={false}
                  onChange={(v: string) => set('postcode', v)} placeholder="1205"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="street" className="label">
                  Full Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="street" rows={2} value={form.street}
                  onChange={(e) => set('street', e.target.value)}
                  placeholder="House / Flat, Road, Block, Landmark…"
                  className={cn('textarea min-h-[70px]', errors.street && 'border-rose-400')}
                />
                {errors.street && <p className="mt-1 text-[12px] font-semibold text-rose-600">{errors.street}</p>}
              </div>

              {/* Shipping estimate */}
              <div className="mt-5 flex items-center justify-between rounded-xl bg-brand-50/70 px-4 py-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-brand-900">
                  <Truck className="h-4 w-4" />
                  Estimated delivery: {shipping.days} days
                </span>
                <span className="text-[15px] font-bold text-brand-900">
                  {shipping.cost === 0 ? 'FREE' : formatPrice(shipping.cost)}
                </span>
              </div>
            </section>

            {/* Note */}
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <label htmlFor="note" className="label">Order Note (optional)</label>
              <textarea
                id="note" rows={2} value={form.customerNote}
                onChange={(e) => set('customerNote', e.target.value)}
                placeholder="Delivery instructions, preferred time, gift message…"
                className="textarea min-h-[70px]"
              />
            </section>

            <button onClick={goToPayment} className="btn-primary btn-lg w-full">
              Continue to Payment <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Delivery summary */}
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-ink-900">
                    <MapPin className="h-4 w-4 text-brand-600" /> Deliver to
                  </h2>
                  <p className="text-[15px] font-semibold text-ink-800">{form.customerName} · {form.phone}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
                    {form.street}{form.area ? `, ${form.area}` : ''}, {form.district}, {form.division}
                    {form.postcode ? ` — ${form.postcode}` : ''}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-500">{form.email}</p>
                </div>
                <button onClick={() => setStep(1)} className="btn-ghost btn-sm shrink-0">Change</button>
              </div>
            </section>

            {/* Payment methods */}
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <CreditCard className="h-4.5 w-4.5 text-brand-600" /> Payment Method
              </h2>

              <div className="space-y-2.5">
                {paymentMethods.map((pm) => (
                  <label
                    key={pm.code}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                      payment === pm.code
                        ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-500'
                        : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50/50'
                    )}
                  >
                    <input
                      type="radio" name="payment" value={pm.code}
                      checked={payment === pm.code}
                      onChange={() => setPayment(pm.code)}
                      className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg leading-none">{pm.icon}</span>
                        <span className="text-[15px] font-bold text-ink-900">{pm.name}</span>
                        {pm.nameBn && <span className="bn text-[13px] text-ink-500">{pm.nameBn}</span>}
                        {pm.code === 'cod' && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[12px] font-bold text-emerald-800">
                            MOST POPULAR
                          </span>
                        )}
                        {pm.isSandbox && pm.code !== 'cod' && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[12px] font-bold text-amber-800">
                            SANDBOX
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-ink-500">{pm.description}</p>

                      {payment === pm.code && pm.instructions && (
                        <div className="mt-3 rounded-lg bg-white/80 p-3 text-[12px] leading-relaxed text-ink-600">
                          {pm.instructions}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4">
              <input
                type="checkbox" checked={form.terms}
                onChange={(e) => { set('terms', e.target.checked); setServerError(''); }}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-[13px] leading-relaxed text-ink-600">
                I have read and agree to the{' '}
                <Link href="/pages/terms" className="font-semibold text-brand-700 underline" target="_blank">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/pages/privacy-policy" className="font-semibold text-brand-700 underline" target="_blank">
                  Privacy Policy
                </Link>
                . I confirm my order details are correct.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-outline">← Back</button>
              <button
                onClick={placeOrder}
                disabled={submitting || !form.terms}
                className="btn-primary btn-lg flex-1 font-bold"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
                ) : (
                  <><Lock className="h-4 w-4" /> Place Order · {formatPrice(total)}</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — summary */}
      <aside className="lg:sticky lg:top-32 lg:h-fit">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900">
            Your Order <span className="text-[15px] font-normal text-ink-500">({items.length})</span>
          </h2>

          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((it) => (
              <div key={it.id} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                  )}
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[12px] font-bold text-white">
                    {it.qty}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-800">{it.name}</p>
                  {it.variant && <p className="mt-0.5 text-[12px] text-ink-400">{it.variant}</p>}
                  <p className="mt-1 text-[13px] font-bold text-ink-900">{formatPrice(it.price * it.qty)}</p>
                </div>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-ink-100 pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-semibold text-ink-900">{formatPrice(summary.subtotal)}</dd>
            </div>
            {summary.discount > 0 && (
              <div className="flex justify-between">
                <dt className="flex items-center gap-1.5 text-emerald-700">
                  <Tag className="h-3.5 w-3.5" /> Discount
                  {summary.coupon && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[12px] font-bold">{summary.coupon.code}</span>}
                </dt>
                <dd className="font-semibold text-emerald-700">−{formatPrice(summary.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-600">Delivery {shipping.zone && <span className="text-[12px] text-ink-400">({shipping.zone})</span>}</dt>
              <dd className="font-semibold text-ink-900">
                {shipping.cost === 0 ? <span className="text-emerald-700">FREE</span> : formatPrice(shipping.cost)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-3 text-base">
              <dt className="font-bold text-ink-900">Total</dt>
              <dd className="font-display text-2xl font-bold text-ink-900">{formatPrice(total)}</dd>
            </div>
          </dl>

          <div className="mt-4 space-y-2 border-t border-ink-100 pt-4">
            <p className="flex items-center gap-2 text-[12px] text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Your information is encrypted and secure
            </p>
            <p className="flex items-center gap-2 text-[12px] text-ink-500">
              <Truck className="h-3.5 w-3.5 text-brand-600" /> Delivered in {shipping.days} days
            </p>
            <p className="flex items-center gap-2 text-[12px] text-ink-500">
              <Check className="h-3.5 w-3.5 text-brand-600" /> 7-day return guarantee
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <p className="text-[13px] font-bold text-brand-900">Need help?</p>
          <p className="mt-1 text-[12px] leading-relaxed text-brand-800">
            Call our hotline for order assistance, 9 AM – 9 PM daily.
          </p>
        </div>
      </aside>
    </div>
  );
}
