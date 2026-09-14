'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, Award, ExternalLink, Loader2, Pencil, Plus, Search, Star, Trash2, X,
} from 'lucide-react';
import { cn, slugify } from '@/lib/utils';

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  country: string | null;
  featured: boolean;
  status: string;
  productCount: number;
};

const EMPTY = {
  id: '',
  name: '',
  slug: '',
  logo: '',
  description: '',
  country: 'Bangladesh',
  featured: false,
  status: 'active',
};

export default function BrandManager({ initial }: { initial: Brand[] }) {
  const router = useRouter();
  const [brands, setBrands] = useState(initial);
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useMemo(() => setBrands(initial), [initial]);

  const list = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q) || b.slug.includes(q));
  }, [brands, search]);

  async function save() {
    if (!panel) return;
    if (!panel.name.trim()) return setErr('Name is required');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...panel, id: panel.id || undefined }),
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

  async function remove(id: string) {
    if (!confirm('Delete this brand? Products will be detached from it.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/brands?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setBrands((p) => p.filter((b) => b.id !== id));
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => { setErr(''); setPanel({ ...EMPTY }); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New brand
        </button>
      </div>

      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((b) => (
            <div key={b.id} className="card group flex flex-col p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink-200 bg-white">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt={b.name} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <Award className="h-5 w-5 text-ink-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-semibold text-ink-900">{b.name}</h3>
                    {b.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="truncate text-[13px] text-ink-400">/{b.slug}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="badge border border-ink-200 bg-ink-50 text-ink-600">{b.productCount} items</span>
                    <span
                      className={cn(
                        'badge border',
                        b.status === 'active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-ink-200 bg-ink-50 text-ink-500'
                      )}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              </div>

              {b.description && (
                <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{b.description}</p>
              )}

              <div className="mt-4 flex items-center gap-1 border-t border-ink-100 pt-3">
                <button
                  onClick={() => {
                    setErr('');
                    setPanel({
                      id: b.id,
                      name: b.name,
                      slug: b.slug,
                      logo: b.logo || '',
                      description: b.description || '',
                      country: b.country || 'Bangladesh',
                      featured: b.featured,
                      status: b.status,
                    });
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <Link
                  href={`/brand/${b.slug}`}
                  target="_blank"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-ink-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View
                </Link>
                <button
                  onClick={() => remove(b.id)}
                  disabled={deleting === b.id}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                >
                  {deleting === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card grid place-items-center py-16 text-center">
          <Award className="h-8 w-8 text-ink-300" />
          <p className="mt-3 text-[15px] font-medium text-ink-600">
            {search ? `No brands match “${search}”.` : 'No brands yet.'}
          </p>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit brand' : 'New brand'}
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
                <label className="label">Brand name *</label>
                <input
                  value={panel.name}
                  onChange={(e) => setPanel({ ...panel, name: e.target.value, slug: panel.id ? panel.slug : slugify(e.target.value) })}
                  className="input"
                  placeholder="e.g. Aarong"
                />
              </div>

              <div>
                <label className="label">Slug</label>
                <input
                  value={panel.slug}
                  onChange={(e) => setPanel({ ...panel, slug: e.target.value })}
                  className="input font-mono text-[13px]"
                />
              </div>

              <div>
                <label className="label">Logo URL</label>
                <input
                  value={panel.logo}
                  onChange={(e) => setPanel({ ...panel, logo: e.target.value })}
                  className="input"
                  placeholder="https://…"
                />
                {panel.logo && (
                  <div className="mt-2 grid h-16 w-16 place-items-center rounded-xl border border-ink-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={panel.logo} alt="" className="h-full w-full object-contain p-1.5" />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Country of origin</label>
                <input
                  value={panel.country}
                  onChange={(e) => setPanel({ ...panel, country: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={panel.description}
                  onChange={(e) => setPanel({ ...panel, description: e.target.value })}
                  className="textarea"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={panel.status}
                  onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                  className="select"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 p-3">
                <input
                  type="checkbox"
                  checked={panel.featured}
                  onChange={(e) => setPanel({ ...panel, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[15px] font-medium text-ink-700">Feature on homepage</span>
              </label>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {panel.id ? 'Save changes' : 'Create brand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
