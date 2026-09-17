'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Check, Eye, EyeOff, GripVertical, Loader2, Save, ShieldCheck,
} from 'lucide-react';
import {
  DEFAULT_CHECKOUT_FIELDS, parseCheckoutFields, requiredCheckoutKeys,
  visibleCheckoutFields, type CheckoutField,
} from '@/lib/checkout-fields';
import { cn } from '@/lib/utils';

/**
 * Controls which fields the checkout form asks for.
 *
 * Reordering is done with the same drag pattern as the menu builder and the
 * landing builder: only the grip is draggable, so the inputs inside a row stay
 * selectable, and `onDragOver` must call `preventDefault` or the browser never
 * fires `onDrop`. Up/down buttons are kept as well, because a drag is not
 * available to everyone.
 *
 * A field that is hidden is forced non-required here and again on the server —
 * otherwise the form would demand something it never renders, and no order could
 * be placed at all.
 */
export default function CheckoutFieldManager({ initial }: { initial: CheckoutField[] }) {
  const router = useRouter();
  const [list, setList] = useState<CheckoutField[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [grabIndex, setGrabIndex] = useState<number | null>(null);

  const dirty = JSON.stringify(list) !== JSON.stringify(initial);
  const shown = visibleCheckoutFields(list);
  const required = requiredCheckoutKeys(list);

  const preview = useMemo(() => shown, [shown]);

  function patch(key: string, next: Partial<CheckoutField>) {
    setList((l) =>
      l.map((f) => {
        if (f.key !== key) return f;
        const merged = { ...f, ...next };
        // Hiding a field must also clear its required flag, or the two settings
        // contradict each other.
        if (!merged.show) merged.required = false;
        return merged;
      })
    );
    setSaved(false);
  }

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setList(next);
    setSaved(false);
  }

  function moveBy(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    move(i, j);
  }

  async function save() {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'checkout',
          values: { checkout_fields: list },
          meta: { checkout_fields: { type: 'json', label: 'Checkout Form Fields' } },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Save failed');

      // Adopt what the server stored — it re-parses and may normalise the list —
      // so `dirty` settles and the saved state is the truth.
      if (data?.settings?.checkout_fields !== undefined) {
        setList(parseCheckoutFields(data.settings.checkout_fields));
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setList(DEFAULT_CHECKOUT_FIELDS.map((f) => ({ ...f })));
    setSaved(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="space-y-3">
        <div className="card divide-y divide-ink-100">
          {list.map((field, i) => (
            <div
              key={field.key}
              draggable={grabIndex === i}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
                setOverIndex(null);
                setGrabIndex(null);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
                setGrabIndex(null);
              }}
              className={cn(
                'flex items-start gap-2.5 p-3 transition',
                overIndex === i && dragIndex !== null && dragIndex !== i && 'bg-brand-50 ring-2 ring-inset ring-brand-400',
                dragIndex === i && 'opacity-40'
              )}
            >
              <span
                onMouseDown={() => setGrabIndex(i)}
                onMouseUp={() => setGrabIndex(null)}
                title="Drag to reorder"
                className="mt-2 cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-ink-300" />
              </span>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-600">
                    {field.key}
                  </code>
                  {!field.show && (
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-bold text-ink-500">
                      hidden
                    </span>
                  )}
                  {field.show && field.required && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
                      required
                    </span>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-0.5 block text-[11px] font-semibold text-ink-500">Label</span>
                    <input
                      value={field.label}
                      onChange={(e) => patch(field.key, { label: e.target.value })}
                      className="input h-8 py-0 text-[13px]"
                      disabled={!field.show}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-0.5 block text-[11px] font-semibold text-ink-500">Placeholder</span>
                    <input
                      value={field.placeholder}
                      onChange={(e) => patch(field.key, { placeholder: e.target.value })}
                      className="input h-8 py-0 text-[13px]"
                      disabled={!field.show}
                      placeholder="(none)"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={field.show}
                      onChange={(e) => patch(field.key, { show: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-[13px] text-ink-700">Show on the form</span>
                  </label>
                  <label className={cn('flex items-center gap-1.5', !field.show && 'opacity-40')}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={!field.show}
                      onChange={(e) => patch(field.key, { required: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-[13px] text-ink-700">Required</span>
                  </label>
                </div>
              </div>

              <div className="mt-1 flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveBy(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                  className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800 disabled:opacity-30"
                >
                  <GripVertical className="h-3 w-3 rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(i, 1)}
                  disabled={i === list.length - 1}
                  title="Move down"
                  className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800 disabled:opacity-30"
                >
                  <GripVertical className="h-3 w-3 -rotate-90" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {err && (
          <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[14px] text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cn('btn', dirty ? 'bg-brand-600 text-white hover:bg-brand-700' : 'btn-outline')}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : saved ? 'Saved' : dirty ? 'Save changes' : 'Save'}
          </button>
          {dirty && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-bold text-amber-800">
              Unsaved
            </span>
          )}
          <button type="button" onClick={reset} className="btn-outline btn-sm">
            Restore defaults
          </button>
        </div>
      </div>

      {/* Preview. The merchant is editing a form they will never see as a
          customer, so showing the result next to the controls is the difference
          between configuring and guessing. */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-[13px] font-bold text-ink-600">Preview</p>
        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
          <p className="font-display text-[15px] font-bold text-ink-900">Checkout</p>
          <p className="mt-0.5 text-[12px] text-ink-500">
            {shown.length} field{shown.length === 1 ? '' : 's'} · {required.length} required
          </p>

          <div className="mt-3 space-y-2.5">
            {preview.map((f) => (
              <div key={f.key}>
                <span className="mb-1 block text-[12px] font-semibold text-ink-700">
                  {f.label}
                  {f.required && <span className="text-rose-500"> *</span>}
                </span>
                {f.key === 'customerNote' ? (
                  <div className="h-14 rounded-lg border border-ink-200 bg-ink-50/60" />
                ) : f.key === 'division' || f.key === 'district' ? (
                  <div className="flex h-9 items-center justify-between rounded-lg border border-ink-200 bg-ink-50/60 px-2 text-[12px] text-ink-400">
                    <span>{f.placeholder || 'Select'}</span>
                    <span>▾</span>
                  </div>
                ) : (
                  <div className="flex h-9 items-center rounded-lg border border-ink-200 bg-ink-50/60 px-2 text-[12px] text-ink-400">
                    {f.placeholder || f.label}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-[13px] font-bold text-white">
            <ShieldCheck className="h-4 w-4" /> Place order
          </div>
        </div>

        <p className="mt-2 text-[12px] leading-snug text-ink-500">
          The order endpoint re-checks the required list, so a customer cannot skip a mandatory field
          by editing the page. Hiding a field also un-requires it.
        </p>
        {shown.length === 0 && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[12px] text-amber-900">
            <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Every field is hidden. The form would ask for nothing and the order would have no name or
            phone number — turn at least those two back on.
          </p>
        )}
      </div>
    </div>
  );
}
