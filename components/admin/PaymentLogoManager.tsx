'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, Check, ImageIcon, Loader2, Plus, RotateCcw, Save,
  Trash2, Upload, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/lib/client-upload';
import { DEFAULT_PAYMENT_LOGOS, blankPaymentLogo, type PaymentLogo } from '@/lib/payment-logos';
import { PaymentMark } from '@/components/PaymentMark';

/**
 * Admin manager for the footer's "Accepted Payments" grid.
 *
 * A repeater rather than a fixed set of fields, so the merchant can add a method
 * that ships later (or remove one they don't accept) without a code change.
 * Order here is the order in the footer grid, which is a 3-column layout — so
 * nine entries fill it exactly.
 *
 * Saving reuses PATCH /api/admin/settings: the whole list is stored as one JSON
 * value, which already handles cache invalidation and the audit log.
 */

const MAX_WIDTH = 480; // a logo tile renders ~120px, so 4x is plenty

export default function PaymentLogoManager({ initial }: { initial: PaymentLogo[] }) {
  const [list, setList] = useState<PaymentLogo[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const dirty = JSON.stringify(list) !== JSON.stringify(initial);

  function patch(id: string, next: Partial<PaymentLogo>) {
    setList((l) => l.map((p) => (p.id === id ? { ...p, ...next } : p)));
    setSaved(false);
    setErr('');
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setList(next);
    setSaved(false);
  }

  function remove(id: string) {
    setList((l) => l.filter((p) => p.id !== id));
    setSaved(false);
  }

  function add() {
    setList((l) => [...l, blankPaymentLogo(l.length)]);
    setSaved(false);
  }

  async function onPick(id: string, file: File) {
    setErr('');
    setBusyId(id);
    try {
      const url = await uploadImage(file, MAX_WIDTH);
      patch(id, { logo: url });
    } catch (e: any) {
      setErr(`Could not upload that logo — ${e.message || 'unknown error'}`);
    } finally {
      setBusyId(null);
      const el = fileRefs.current[id];
      if (el) el.value = '';
    }
  }

  async function save() {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'payment_logos',
          values: { payment_logos: list },
          meta: { payment_logos: { type: 'json', label: 'Accepted Payment Logos' } },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setSaved(true);
      // Refresh so the footer picks up the new value on the next navigation.
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[15px] font-bold text-ink-900">
            {list.length} method{list.length === 1 ? '' : 's'}
          </p>
          <p className="text-[13px] text-ink-500">
            The footer grid is 3 columns, so nine methods fill it exactly. Order here is the order
            shown to customers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setList(DEFAULT_PAYMENT_LOGOS); setSaved(false); }} className="btn-outline btn-sm">
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
          <button type="button" onClick={add} className="btn-outline btn-sm">
            <Plus className="h-3.5 w-3.5" /> Add method
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className={cn('btn btn-sm', dirty ? 'bg-brand-600 text-white hover:bg-brand-700' : 'btn-dark opacity-50')}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save logos'}
          </button>
        </div>
      </div>

      {saved && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-800">
          <Check className="h-4 w-4 shrink-0" /> Saved. The footer grid is updated.
        </p>
      )}
      {err && (
        <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </p>
      )}

      {/* ── Repeater ── */}
      <div className="space-y-3">
        {list.map((p, i) => (
          <div key={p.id} className="card p-4">
            <div className="flex flex-wrap items-start gap-4">
              {/* Logo tile — mirrors how it renders in the footer. */}
              <div className="shrink-0">
                <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-white p-1.5">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <PaymentMark label={p.label} mark={p.mark} color={p.color} />
                  )}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileRefs.current[p.id]?.click()}
                    disabled={busyId === p.id}
                    className="btn-outline btn-sm"
                  >
                    {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {p.logo ? 'Replace' : 'Upload'}
                  </button>
                  {p.logo && (
                    <button
                      type="button"
                      onClick={() => patch(p.id, { logo: '' })}
                      title="Remove uploaded logo and use the built-in mark"
                      className="btn-sm inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <input
                  ref={(el) => { fileRefs.current[p.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPick(p.id, f);
                  }}
                />
              </div>

              {/* Fields */}
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label mb-0">Brand name</label>
                  <input
                    value={p.label}
                    onChange={(e) => patch(p.id, { label: e.target.value })}
                    placeholder="e.g. bKash"
                    className="input mt-1 text-[13px]"
                  />
                </div>
                <div>
                  <label className="label mb-0">Short mark</label>
                  <input
                    value={p.mark}
                    onChange={(e) => patch(p.id, { mark: e.target.value })}
                    placeholder="e.g. bKash"
                    maxLength={8}
                    className="input mt-1 text-[13px]"
                  />
                  <p className="mt-1 text-[12px] text-ink-400">
                    Drawn on the tile when no logo is uploaded. Max 8 characters.
                  </p>
                </div>
                <div>
                  <label className="label mb-0">Brand colour</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={p.color}
                      onChange={(e) => patch(p.id, { color: e.target.value })}
                      className="color-swatch h-9 w-12"
                      aria-label={`Colour for ${p.label || 'this method'}`}
                    />
                    <input
                      value={p.color}
                      onChange={(e) => patch(p.id, { color: e.target.value })}
                      className="input font-mono text-[13px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="label mb-0">Caption <span className="font-normal text-ink-400">(optional)</span></label>
                  <input
                    value={p.note || ''}
                    onChange={(e) => patch(p.id, { note: e.target.value })}
                    placeholder="e.g. Up to ৳10,000"
                    className="input mt-1 text-[13px]"
                  />
                </div>
              </div>

              {/* Reorder + delete */}
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                  aria-label="Move up"
                  className="rounded-lg border border-ink-200 p-1.5 text-ink-600 transition hover:bg-ink-50 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1}
                  title="Move down"
                  aria-label="Move down"
                  className="rounded-lg border border-ink-200 p-1.5 text-ink-600 transition hover:bg-ink-50 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  title="Delete method"
                  aria-label="Delete method"
                  className="rounded-lg border border-ink-200 p-1.5 text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {list.length === 0 && (
          <div className="card py-12 text-center">
            <ImageIcon className="mx-auto mb-3 h-8 w-8 text-ink-300" />
            <p className="text-[15px] font-semibold text-ink-700">No payment methods</p>
            <p className="mt-1 text-[13px] text-ink-500">
              The footer grid will be hidden until you add at least one.
            </p>
          </div>
        )}
      </div>

      {/* ── Live 3×3 preview ── */}
      <div className="card p-5">
        <h2 className="font-display text-base font-bold text-ink-900">Footer preview</h2>
        <p className="mb-4 text-[13px] text-ink-500">
          Exactly how the grid renders in the storefront footer (dark background).
        </p>
        <div className="rounded-2xl bg-ink-900 p-5">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-500">
            Accepted Payments
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {list.map((p) => (
              <div
                key={p.id}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white px-2 py-3"
                title={p.label}
              >
                <div className="flex h-8 items-center justify-center">
                  {p.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logo} alt="" className="max-h-8 max-w-full object-contain" />
                  ) : (
                    <PaymentMark label={p.label} mark={p.mark} color={p.color} small />
                  )}
                </div>
                <span className="w-full truncate text-center text-[11px] font-semibold text-ink-600">
                  {p.label}
                </span>
              </div>
            ))}
            {/* Pad the preview so a partial row still shows the 3-column rhythm */}
            {Array.from({ length: (3 - (list.length % 3)) % 3 }).map((_, i) => (
              <div
                key={`pad-${i}`}
                className="rounded-xl border border-dashed border-white/12 py-3"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
