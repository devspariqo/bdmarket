'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronRight, Image as ImageIcon, Pencil, Plus, Search,
  Trash2, X, Loader2, AlertCircle, Star,
} from 'lucide-react';
import { cn, slugify } from '@/lib/utils';

type Cat = {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  position: number;
  featured: boolean;
  status: string;
  metaTitle: string | null;
  metaDesc: string | null;
  productCount: number;
};

const EMPTY = {
  id: '',
  name: '',
  nameBn: '',
  slug: '',
  description: '',
  image: '',
  parentId: '',
  position: 0,
  featured: false,
  status: 'active',
  metaTitle: '',
  metaDesc: '',
};

export default function CategoryManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>(initial);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Keep local state fresh after router.refresh()
  useEffect(() => setCats(initial), [initial]);
  const byParent = useMemo(() => {
    const map: Record<string, Cat[]> = {};
    for (const c of cats) {
      const key = c.parentId || 'root';
      (map[key] ||= []).push(c);
    }
    return map;
  }, [cats]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return cats.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.nameBn || '').includes(search)
    );
  }, [cats, search]);

  function openNew(parentId = '') {
    setErr('');
    setPanel({ ...EMPTY, parentId });
  }

  function openEdit(c: Cat) {
    setErr('');
    setPanel({
      id: c.id,
      name: c.name,
      nameBn: c.nameBn || '',
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      parentId: c.parentId || '',
      position: c.position,
      featured: c.featured,
      status: c.status,
      metaTitle: c.metaTitle || '',
      metaDesc: c.metaDesc || '',
    });
  }

  async function save() {
    if (!panel) return;
    if (!panel.name.trim()) {
      setErr('Name is required');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/categories', {
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
    if (!confirm('Delete this category? Products will keep their data but lose this category link.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setCats((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  function Row({ c, depth }: { c: Cat; depth: number }) {
    const kids = byParent[c.id] || [];
    const hasKids = kids.length > 0;
    const isOpen = expanded[c.id] ?? depth < 1;

    return (
      <>
        <tr className="border-b border-ink-100 transition hover:bg-ink-50/60">
          <td className="td">
            <div className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
              {hasKids ? (
                <button
                  onClick={() => setExpanded((p) => ({ ...p, [c.id]: !isOpen }))}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-ink-500 hover:bg-ink-100"
                  aria-label={isOpen ? 'Collapse' : 'Expand'}
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="h-6 w-6 shrink-0" />
              )}
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-ink-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-ink-900">{c.name}</span>
                  {c.featured && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                </div>
                <span className="block truncate text-[13px] text-ink-400">
                  {c.nameBn ? `${c.nameBn} • ` : ''}/{c.slug}
                </span>
              </div>
            </div>
          </td>
          <td className="td">
            <span className="badge border border-ink-200 bg-ink-50 text-ink-600">{c.productCount} products</span>
          </td>
          <td className="td text-ink-500">{c.position}</td>
          <td className="td">
            <span
              className={cn(
                'badge border',
                c.status === 'active'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-ink-200 bg-ink-50 text-ink-500'
              )}
            >
              {c.status}
            </span>
          </td>
          <td className="td">
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openNew(c.id)}
                title="Add sub-category"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => openEdit(c)}
                title="Edit"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => remove(c.id)}
                disabled={deleting === c.id}
                title="Delete"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
              >
                {deleting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          </td>
        </tr>
        {hasKids && isOpen && kids.map((k) => <Row key={k.id} c={k} depth={depth + 1} />)}
      </>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => openNew()} className="btn-primary">
          <Plus className="h-4 w-4" /> New category
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-ink-50/70">
            <tr>
              <th className="th">Category</th>
              <th className="th">Products</th>
              <th className="th">Order</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered ? (
              filtered.length ? (
                filtered.map((c) => <Row key={c.id} c={c} depth={0} />)
              ) : (
                <tr>
                  <td colSpan={5} className="td py-12 text-center text-ink-400">
                    No categories match “{search}”.
                  </td>
                </tr>
              )
            ) : (byParent.root || []).length ? (
              (byParent.root || []).map((c) => <Row key={c.id} c={c} depth={0} />)
            ) : (
              <tr>
                <td colSpan={5} className="td py-12 text-center text-ink-400">
                  No categories yet. Create your first one.
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
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit category' : 'New category'}
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
                <label className="label">Name *</label>
                <input
                  value={panel.name}
                  onChange={(e) => setPanel({ ...panel, name: e.target.value, slug: panel.id ? panel.slug : slugify(e.target.value) })}
                  className="input"
                  placeholder="e.g. Saree"
                />
              </div>

              <div>
                <label className="label">Name (Bangla)</label>
                <input
                  value={panel.nameBn}
                  onChange={(e) => setPanel({ ...panel, nameBn: e.target.value })}
                  className="input bn"
                  placeholder="e.g. শাড়ি"
                />
              </div>

              <div>
                <label className="label">Slug</label>
                <input
                  value={panel.slug}
                  onChange={(e) => setPanel({ ...panel, slug: e.target.value })}
                  className="input font-mono text-[13px]"
                  placeholder="saree"
                />
              </div>

              <div>
                <label className="label">Parent category</label>
                <select
                  value={panel.parentId}
                  onChange={(e) => setPanel({ ...panel, parentId: e.target.value })}
                  className="select"
                >
                  <option value="">— None (top level) —</option>
                  {cats
                    .filter((c) => c.id !== panel.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? '— ' : ''}
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={panel.description}
                  onChange={(e) => setPanel({ ...panel, description: e.target.value })}
                  className="textarea"
                  placeholder="Shown on the category landing page…"
                />
              </div>

              <div>
                <label className="label">Image URL</label>
                <input
                  value={panel.image}
                  onChange={(e) => setPanel({ ...panel, image: e.target.value })}
                  className="input"
                  placeholder="https://images.unsplash.com/…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sort position</label>
                  <input
                    type="number"
                    value={panel.position}
                    onChange={(e) => setPanel({ ...panel, position: Number(e.target.value) })}
                    className="input"
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

              <details className="rounded-xl border border-ink-200">
                <summary className="cursor-pointer px-3 py-2.5 text-[15px] font-semibold text-ink-700">
                  SEO settings
                </summary>
                <div className="space-y-3 border-t border-ink-100 p-3">
                  <div>
                    <label className="label">Meta title</label>
                    <input
                      value={panel.metaTitle}
                      onChange={(e) => setPanel({ ...panel, metaTitle: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Meta description</label>
                    <textarea
                      value={panel.metaDesc}
                      onChange={(e) => setPanel({ ...panel, metaDesc: e.target.value })}
                      className="textarea min-h-[80px]"
                    />
                  </div>
                </div>
              </details>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {panel.id ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
