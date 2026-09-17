'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Copy, ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LandingRow = {
  id: string;
  title: string;
  slug: string;
  parentSlug: string;
  status: string;
  views: number;
  orders: number;
  revenue: number;
  updated: string;
  path: string;
};

/**
 * The landing-page list.
 *
 * Views and orders sit next to each other on purpose: a funnel page that gets
 * traffic and no orders is a page problem, and one that gets neither is a
 * traffic problem, and the merchant cannot tell which without both numbers.
 */
export default function LandingPageList({ initial, base }: { initial: LandingRow[]; base: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) => r.title.toLowerCase().includes(needle) || r.path.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  async function create() {
    setCreating(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Untitled landing page',
          parentSlug: 'collection',
          // Start with something usable rather than a blank canvas: a hero and a
          // checkout block is the shape of every funnel page, and deleting two
          // blocks is faster than building them.
          blocks: [
            {
              id: 'start-hero',
              type: 'hero',
              props: {
                image: '', heading: 'Your headline here',
                subheading: 'A short line that explains the offer.',
                ctaLabel: 'Order now', ctaHref: '#order', overlay: 45, height: 520, align: 'center',
              },
              style: {},
            },
            {
              id: 'start-checkout',
              type: 'checkout',
              props: {
                heading: 'Order now', subheading: 'Cash on delivery. We will call to confirm.',
                buttonLabel: 'Place order',
                successText: 'Thank you! We have received your order and will call you shortly.',
                fields: ['customerName', 'phone', 'district', 'street'],
                required: ['customerName', 'phone', 'district', 'street'],
              },
              style: {},
            },
          ],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not create the page');
      router.push(`${base}/landing-pages/${data.page.id}`);
    } catch (e: any) {
      setErr(e?.message || 'Could not create the page');
      setCreating(false);
    }
  }

  async function toggle(row: LandingRow) {
    setBusy(row.id);
    setErr('');
    const next = row.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status: next }),
      });
      if (!res.ok) throw new Error('Could not change the status');
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: next } : x)));
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Could not change the status');
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(row: LandingRow) {
    setBusy(row.id);
    setErr('');
    try {
      // Copied server-side — the list does not carry the block tree.
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateOf: row.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not duplicate');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Could not duplicate');
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: LandingRow) {
    if (!confirm(`Delete "${row.title}"? Orders it produced are kept.`)) return;
    setBusy(row.id);
    setErr('');
    try {
      const res = await fetch(`/api/admin/landing-pages?id=${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete');
      setRows((r) => r.filter((x) => x.id !== row.id));
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Could not delete');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages…"
            className="input h-9 w-full py-0 pl-8 sm:w-64"
          />
        </div>
        <button type="button" onClick={create} disabled={creating} className="btn bg-brand-600 text-white hover:bg-brand-700">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New landing page
        </button>
      </div>

      {err && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[14px] text-rose-800">{err}</p>}

      {filtered.length === 0 ? (
        <div className="card grid place-items-center px-4 py-16 text-center">
          <BarChart3 className="h-8 w-8 text-ink-300" />
          <p className="mt-3 font-display text-[17px] font-bold text-ink-800">
            {rows.length === 0 ? 'No landing pages yet' : 'Nothing matches that search'}
          </p>
          <p className="mt-1 max-w-md text-[14px] text-ink-500">
            {rows.length === 0
              ? 'A landing page is a standalone product page with no menu and no footer, built for paid traffic. Start one and add your product.'
              : 'Try a different word, or clear the search.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="border-b border-ink-100 text-[12px] uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Page</th>
                  <th className="px-3 py-2.5 font-semibold">Views</th>
                  <th className="px-3 py-2.5 font-semibold">Orders</th>
                  <th className="px-3 py-2.5 font-semibold">Revenue</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-ink-50/60">
                    <td className="px-3 py-2.5">
                      <Link href={`${base}/landing-pages/${row.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                        {row.title}
                      </Link>
                      <span className="mt-0.5 block truncate font-mono text-[12px] text-ink-400">{row.path}</span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-700">{row.views.toLocaleString()}</td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-700">{row.orders.toLocaleString()}</td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-700">৳{row.revenue.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[12px] font-bold',
                          row.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-600'
                        )}
                      >
                        {row.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <a href={row.path} target="_blank" rel="noreferrer" title="Open the page" className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-ink-800">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button type="button" onClick={() => toggle(row)} disabled={busy === row.id} title={row.status === 'published' ? 'Unpublish' : 'Publish'} className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-ink-800">
                          {busy === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : row.status === 'published' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button type="button" onClick={() => duplicate(row)} disabled={busy === row.id} title="Duplicate" className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-ink-800">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <Link href={`${base}/landing-pages/${row.id}`} title="Edit" className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-ink-800">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button type="button" onClick={() => remove(row)} disabled={busy === row.id} title="Delete" className="grid h-7 w-7 place-items-center rounded text-ink-400 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
