'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, ExternalLink, FileText, LayoutTemplate, Loader2, Menu as MenuIcon,
  Pencil, Plus, Search, Trash2, X, Check,
} from 'lucide-react';
import { cn, slugify } from '@/lib/utils';

type Page = {
  id: string;
  title: string;
  titleBn: string | null;
  slug: string;
  content: string;
  excerpt: string | null;
  template: string;
  status: string;
  showInMenu: boolean;
  menuOrder: number;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  metaKeywords: string | null;
  updated: string;
};

const EMPTY = {
  id: '',
  title: '',
  titleBn: '',
  slug: '',
  content: '',
  excerpt: '',
  template: 'default',
  status: 'published',
  showInMenu: false,
  menuOrder: 0,
  featuredImage: '',
  metaTitle: '',
  metaDesc: '',
  metaKeywords: '',
};

const TEMPLATES = [
  { key: 'default', label: 'Default' },
  { key: 'full-width', label: 'Full width' },
  { key: 'sidebar', label: 'With sidebar' },
  { key: 'contact', label: 'Contact / form' },
];

export default function PageManager({ pages }: { pages: Page[] }) {
  const router = useRouter();
  const [list, setList] = useState(pages);
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => setList(pages), [pages]);
  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((p) => p.title.toLowerCase().includes(q) || p.slug.includes(q));
  }, [list, search]);

  function openNew() {
    setErr('');
    setPanel({ ...EMPTY, menuOrder: list.length });
  }

  async function save(status?: string) {
    if (!panel) return;
    if (!panel.title.trim()) return setErr('Title is required');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...panel, id: panel.id || undefined, status: status || panel.status }),
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
    if (!confirm('Delete this page permanently?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/pages?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.filter((x) => x.id !== id));
      router.refresh();
    } catch {
      alert('Could not delete this page.');
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
            placeholder="Search pages…"
            className="input pl-9"
          />
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> New page
        </button>
      </div>

      {filtered.length ? (
        <div className="table-wrap">
          <table className="w-full min-w-[720px]">
            <thead className="bg-ink-50/70">
              <tr>
                <th className="th">Page</th>
                <th className="th">Template</th>
                <th className="th">In menu</th>
                <th className="th">Status</th>
                <th className="th">Updated</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-ink-100 transition hover:bg-ink-50/50">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/pages/${p.slug}`}
                          target="_blank"
                          className="block truncate font-semibold text-ink-900 hover:text-brand-700"
                        >
                          {p.title}
                        </Link>
                        <span className="block truncate font-mono text-[12px] text-ink-400">/{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className="badge border border-ink-200 bg-white text-ink-600">{p.template}</span>
                  </td>
                  <td className="td">
                    {p.showInMenu ? (
                      <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700">
                        <Check className="h-3 w-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-[13px] text-ink-300">—</span>
                    )}
                  </td>
                  <td className="td">
                    <span
                      className={cn(
                        'badge border',
                        p.status === 'published'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="td whitespace-nowrap text-[13px] text-ink-500">{p.updated}</td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/pages/${p.slug}`}
                        target="_blank"
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setErr('');
                          setPanel({
                            id: p.id,
                            title: p.title,
                            titleBn: p.titleBn || '',
                            slug: p.slug,
                            content: p.content,
                            excerpt: p.excerpt || '',
                            template: p.template,
                            status: p.status,
                            showInMenu: p.showInMenu,
                            menuOrder: p.menuOrder,
                            featuredImage: p.featuredImage || '',
                            metaTitle: p.metaTitle || '',
                            metaDesc: p.metaDesc || '',
                            metaKeywords: p.metaKeywords || '',
                          });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        disabled={deleting === p.id}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      >
                        {deleting === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card grid place-items-center py-16 text-center">
          <FileText className="h-8 w-8 text-ink-300" />
          <p className="mt-3 text-[15px] font-medium text-ink-600">
            {search ? `No pages match “${search}”.` : 'No pages yet.'}
          </p>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit page' : 'New page'}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Title *</label>
                  <input
                    value={panel.title}
                    onChange={(e) =>
                      setPanel({
                        ...panel,
                        title: e.target.value,
                        slug: panel.id ? panel.slug : slugify(e.target.value),
                      })
                    }
                    className="input"
                    placeholder="About Us"
                  />
                </div>
                <div>
                  <label className="label">Title (Bangla)</label>
                  <input
                    value={panel.titleBn}
                    onChange={(e) => setPanel({ ...panel, titleBn: e.target.value })}
                    className="input bn"
                    placeholder="আমাদের সম্পর্কে"
                  />
                </div>
              </div>

              <div>
                <label className="label">URL slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-ink-400">/pages/</span>
                  <input
                    value={panel.slug}
                    onChange={(e) => setPanel({ ...panel, slug: e.target.value })}
                    className="input font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="label">Excerpt</label>
                <input
                  value={panel.excerpt}
                  onChange={(e) => setPanel({ ...panel, excerpt: e.target.value })}
                  className="input"
                  placeholder="One-line summary used in listings"
                />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea
                  value={panel.content}
                  onChange={(e) => setPanel({ ...panel, content: e.target.value })}
                  className="textarea min-h-[280px] font-mono text-[13px] leading-relaxed"
                  placeholder={'Write your page content here.\n\nMarkdown and HTML are both supported.'}
                />
                <p className="mt-1 text-[12px] text-ink-400">
                  {panel.content.length} characters · {panel.content.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Template</label>
                  <select
                    value={panel.template}
                    onChange={(e) => setPanel({ ...panel, template: e.target.value })}
                    className="select"
                  >
                    {TEMPLATES.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Featured image URL</label>
                  <input
                    value={panel.featuredImage}
                    onChange={(e) => setPanel({ ...panel, featuredImage: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Menu order</label>
                  <input
                    type="number"
                    value={panel.menuOrder}
                    onChange={(e) => setPanel({ ...panel, menuOrder: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <label className="flex cursor-pointer items-end gap-2.5 pb-2.5">
                  <input
                    type="checkbox"
                    checked={panel.showInMenu}
                    onChange={(e) => setPanel({ ...panel, showInMenu: e.target.checked })}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-[15px] font-medium text-ink-700">Show in footer menu</span>
                </label>
              </div>

              <details className="rounded-xl border border-ink-200" open={false}>
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
                      placeholder={panel.title || 'Page title'}
                    />
                    <p className="mt-1 text-[12px] text-ink-400">
                      {(panel.metaTitle || panel.title).length}/60 characters
                    </p>
                  </div>
                  <div>
                    <label className="label">Meta description</label>
                    <textarea
                      value={panel.metaDesc}
                      onChange={(e) => setPanel({ ...panel, metaDesc: e.target.value })}
                      className="textarea min-h-[80px]"
                    />
                    <p className="mt-1 text-[12px] text-ink-400">{panel.metaDesc.length}/160 characters</p>
                  </div>
                  <div>
                    <label className="label">Focus keywords</label>
                    <input
                      value={panel.metaKeywords}
                      onChange={(e) => setPanel({ ...panel, metaKeywords: e.target.value })}
                      className="input"
                      placeholder="about bd market, bangladesh fashion store"
                    />
                  </div>
                </div>
              </details>
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-ink-400">Status:</span>
                <select
                  value={panel.status}
                  onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                  className="input h-9 w-36 py-0 text-[15px]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPanel(null)} className="btn-outline">
                  Cancel
                </button>
                <button onClick={() => save('draft')} disabled={saving} className="btn-outline">
                  Save draft
                </button>
                <button onClick={() => save()} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {panel.id ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
