'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Copy, Loader2, Lock, Pencil, Plus, Search, Ticket, Trash2, X,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomer: number;
  startsAt: string;
  expiresAt: string;
  status: string;
};

const EMPTY = {
  id: '',
  code: '',
  description: '',
  type: 'percent',
  value: 10,
  minOrder: 0,
  maxDiscount: '' as string | number,
  usageLimit: '' as string | number,
  perCustomer: 1,
  startsAt: '',
  expiresAt: '',
  status: 'active',
};

const TYPE_LABEL: Record<string, string> = {
  percent: 'Percentage',
  fixed: 'Fixed amount',
  freeship: 'Free shipping',
};

export default function CouponManager({ initial }: { initial: Coupon[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initial);
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => setCoupons(initial), [initial]);
  const list = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter((c) => c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [coupons, search]);

  async function save() {
    if (!panel) return;
    if (!panel.code.trim()) return setErr('Coupon code is required');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...panel,
          id: panel.id || undefined,
          code: panel.code.toUpperCase(),
          maxDiscount: panel.maxDiscount === '' ? null : Number(panel.maxDiscount),
          usageLimit: panel.usageLimit === '' ? null : Number(panel.usageLimit),
          startsAt: panel.startsAt || null,
          expiresAt: panel.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPanel(null);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: Coupon) {
    const next = c.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...c, id: c.id, status: next }),
      });
      if (!res.ok) throw new Error('Failed');
      setCoupons((p) => p.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
      router.refresh();
    } catch {
      alert('Could not update this coupon.');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this coupon? Existing orders keep their discount record.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setCoupons((p) => p.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      alert('Could not delete this coupon.');
    } finally {
      setDeleting(null);
    }
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code);
  }

  const now = Date.now();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupons…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => { setErr(''); setPanel({ ...EMPTY }); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      {list.length ? (
        <div className="table-wrap">
          <table className="w-full min-w-[780px]">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="th">Code</th>
                <th className="th">Discount</th>
                <th className="th">Conditions</th>
                <th className="th">Usage</th>
                <th className="th">Expires</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt).getTime() < now;
                const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit;
                const pct = c.usageLimit ? Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100)) : 0;

                return (
                  <tr key={c.id} className="border-b border-ink-100 transition hover:bg-ink-50/50">
                    <td className="td">
                      <button
                        onClick={() => copy(c.code)}
                        className="group flex items-center gap-1.5"
                        title="Copy code"
                      >
                        <span className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-2.5 py-1 font-mono text-[15px] font-bold tracking-wide text-brand-800">
                          {c.code}
                        </span>
                        <Copy className="h-3.5 w-3.5 text-ink-300 transition group-hover:text-brand-600" />
                      </button>
                      {c.description && (
                        <p className="mt-1 max-w-[200px] truncate text-[13px] text-ink-400">{c.description}</p>
                      )}
                    </td>
                    <td className="td">
                      <span className="font-semibold text-ink-900">
                        {c.type === 'percent'
                          ? `${c.value}% off`
                          : c.type === 'fixed'
                          ? `${formatPrice(c.value)} off`
                          : 'Free shipping'}
                      </span>
                      {c.maxDiscount && c.type === 'percent' && (
                        <span className="ml-1 text-[13px] text-ink-400">max {formatPrice(c.maxDiscount)}</span>
                      )}
                    </td>
                    <td className="td text-[13px] text-ink-500">
                      {c.minOrder > 0 ? `Min. ${formatPrice(c.minOrder)}` : 'No minimum'}
                      <br />
                      {c.perCustomer}× per customer
                    </td>
                    <td className="td">
                      <div className="w-28">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="font-medium text-ink-700">
                            {c.usedCount}
                            {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                          </span>
                          {c.usageLimit && <span className="text-ink-400">{pct}%</span>}
                        </div>
                        {c.usageLimit && (
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                            <div
                              className={cn('h-full rounded-full', pct >= 100 ? 'bg-rose-500' : 'bg-brand-500')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="td whitespace-nowrap text-[13px]">
                      {c.expiresAt ? (
                        <span className={expired ? 'text-rose-600' : 'text-ink-500'}>
                          {expired ? 'Expired ' : ''}
                          {c.expiresAt}
                        </span>
                      ) : (
                        <span className="text-ink-300">Never</span>
                      )}
                    </td>
                    <td className="td">
                      <button
                        onClick={() => toggle(c)}
                        className={cn(
                          'badge border transition',
                          expired || exhausted || c.status !== 'active'
                            ? 'border-ink-200 bg-ink-50 text-ink-500'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {expired ? 'expired' : exhausted ? 'used up' : c.status}
                      </button>
                    </td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setErr('');
                            setPanel({
                              id: c.id,
                              code: c.code,
                              description: c.description || '',
                              type: c.type,
                              value: c.value,
                              minOrder: c.minOrder,
                              maxDiscount: c.maxDiscount ?? '',
                              usageLimit: c.usageLimit ?? '',
                              perCustomer: c.perCustomer,
                              startsAt: c.startsAt,
                              expiresAt: c.expiresAt,
                              status: c.status,
                            });
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          disabled={deleting === c.id}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        >
                          {deleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card grid place-items-center py-16 text-center">
          <Ticket className="h-8 w-8 text-ink-300" />
          <p className="mt-3 text-[15px] font-medium text-ink-600">
            {search ? `No coupons match “${search}”.` : 'No coupons yet — create your first one.'}
          </p>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit coupon' : 'New coupon'}
              </h2>
              <button onClick={() => setPanel(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 p-5">
              {err && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[15px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
                </div>
              )}

              <div>
                <label className="label">Coupon code *</label>
                <input
                  value={panel.code}
                  onChange={(e) => setPanel({ ...panel, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                  className="input font-mono tracking-wide"
                  placeholder="EIDSALE25"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <input
                  value={panel.description}
                  onChange={(e) => setPanel({ ...panel, description: e.target.value })}
                  className="input"
                  placeholder="Internal note shown in the admin only"
                />
              </div>

              <div>
                <label className="label">Discount type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['percent', 'fixed', 'freeship'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPanel({ ...panel, type: t })}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition',
                        panel.type === t
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                          : 'border-ink-200 text-ink-600 hover:border-ink-300'
                      )}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              {panel.type !== 'freeship' && (
                <div>
                  <label className="label">{panel.type === 'percent' ? 'Percentage off' : 'Amount off (৳)'}</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.value}
                    onChange={(e) => setPanel({ ...panel, value: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Minimum order (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.minOrder}
                    onChange={(e) => setPanel({ ...panel, minOrder: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Max discount (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.maxDiscount}
                    placeholder="Unlimited"
                    onChange={(e) => setPanel({ ...panel, maxDiscount: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total usage limit</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.usageLimit}
                    placeholder="Unlimited"
                    onChange={(e) => setPanel({ ...panel, usageLimit: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Per customer</label>
                  <input
                    type="number"
                    min={1}
                    value={panel.perCustomer}
                    onChange={(e) => setPanel({ ...panel, perCustomer: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Starts</label>
                  <input
                    type="date"
                    value={panel.startsAt}
                    onChange={(e) => setPanel({ ...panel, startsAt: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Expires</label>
                  <input
                    type="date"
                    value={panel.expiresAt}
                    onChange={(e) => setPanel({ ...panel, expiresAt: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={panel.status}
                  onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                  className="select"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {panel.id ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
