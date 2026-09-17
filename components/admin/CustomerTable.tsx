'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, MapPin, Phone, Save, Tag, Trash2, UserRound, X, Loader2, AlertCircle,
} from 'lucide-react';
import { cn, formatNumber, formatPrice } from '@/lib/utils';

type C = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  district: string | null;
  tags: string | null;
  totalSpent: number;
  orderCount: number;
  reviewCount: number;
  acceptsMarketing: boolean;
  joined: string;
};

const SUGGESTED = ['vip', 'wholesale', 'reseller', 'frequent', 'inactive', 'newsletter', 'chronic-cod-canceller'];

export default function CustomerTable({ customers, base }: { customers: C[]; base: string }) {
  const router = useRouter();
  const [panel, setPanel] = useState<C | null>(null);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [marketing, setMarketing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  function open(c: C) {
    setPanel(c);
    setTags(c.tags || '');
    setNotes('');
    setMarketing(c.acceptsMarketing);
    setErr('');
  }

  function toggleTag(t: string) {
    const list = tags.split(',').map((s) => s.trim()).filter(Boolean);
    const next = list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
    setTags(next.join(', '));
  }

  async function save() {
    if (!panel) return;
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: panel.id, tags, notes, acceptsMarketing: marketing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPanel(null);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: C) {
    if (!confirm(`Delete ${c.name}? Their orders are kept but unlinked. This cannot be undone.`)) return;
    setDeleting(c.id);
    try {
      const res = await fetch(`/api/admin/customers?id=${c.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  const activeTags = tags.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <div className="table-wrap">
        <table className="w-full min-w-[820px]">
          <thead className="bg-ink-50/70">
            <tr>
              <th className="th">Customer</th>
              <th className="th">Location</th>
              <th className="th">Orders</th>
              <th className="th">Lifetime spend</th>
              <th className="th">Tags</th>
              <th className="th">Joined</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length ? (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-ink-100 transition hover:bg-ink-50/50">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-[13px] font-bold text-brand-700">
                        {c.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate font-semibold text-ink-900">{c.name}</span>
                        <span className="flex items-center gap-1 truncate text-[13px] text-ink-400">
                          <Mail className="h-3 w-3 shrink-0" /> {c.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="text-[13px] text-ink-600">
                      {c.district ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.district}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                      {c.phone && (
                        <span className="mt-0.5 flex items-center gap-1 text-ink-400">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <Link href={`${base}/orders?q=${encodeURIComponent(c.email)}`} className="font-semibold text-brand-700 hover:underline">
                      {formatNumber(c.orderCount)}
                    </Link>
                  </td>
                  <td className="td font-semibold text-ink-900">{formatPrice(c.totalSpent)}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || '')
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((t) => (
                          <span key={t} className="badge border border-brand-200 bg-brand-50 text-brand-700">
                            {t}
                          </span>
                        ))}
                      {!c.tags && <span className="text-[13px] text-ink-300">—</span>}
                    </div>
                  </td>
                  <td className="td whitespace-nowrap text-[13px] text-ink-500">{c.joined}</td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => open(c)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-blue-50 hover:text-blue-700"
                        title="Edit tags & notes"
                      >
                        <Tag className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        disabled={deleting === c.id}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        title="Delete customer"
                      >
                        {deleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="td py-14 text-center text-ink-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-display text-[13px] font-bold text-brand-700">
                  {panel.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-ink-900">{panel.name}</h2>
                  <p className="text-[13px] text-ink-400">{panel.email}</p>
                </div>
              </div>
              <button onClick={() => setPanel(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-5">
              {err && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[15px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Metric label="Orders" value={formatNumber(panel.orderCount)} />
                <Metric label="Spent" value={formatPrice(panel.totalSpent)} />
                <Metric label="Reviews" value={formatNumber(panel.reviewCount)} />
              </div>

              <div>
                <label className="label">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input"
                  placeholder="comma, separated, tags"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={cn('chip', activeTags.includes(t) && 'chip-active')}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Internal notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea"
                  placeholder="Anything the team should know about this customer…"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 p-3">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[15px] font-medium text-ink-700">
                  Accepts marketing
                  <span className="ml-1 text-[13px] font-normal text-ink-400">(email & SMS campaigns)</span>
                </span>
              </label>

              <div className="rounded-xl border border-ink-200 p-3">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-500">
                  <UserRound className="h-3.5 w-3.5" /> Lifetime summary
                </p>
                <dl className="mt-2 space-y-1.5 text-[15px]">
                  <Row label="Joined" value={panel.joined} />
                  <Row label="District" value={panel.district || '—'} />
                  <Row label="Phone" value={panel.phone || '—'} />
                  <Row
                    label="Avg. order value"
                    value={panel.orderCount ? formatPrice(Math.round(panel.totalSpent / panel.orderCount)) : '—'}
                  />
                </dl>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save customer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-3 text-center">
      <p className="text-[12px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  );
}
