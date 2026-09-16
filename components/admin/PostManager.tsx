'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, Calendar, ExternalLink, Eye, Loader2, Newspaper, Pencil, Plus,
  Search, Sparkles, Trash2, X,
} from 'lucide-react';
import { cn, slugify } from '@/lib/utils';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  category: string | null;
  tags: string | null;
  authorName: string;
  status: string;
  featured: boolean;
  readMinutes: number;
  viewCount: number;
  metaTitle: string | null;
  metaDesc: string | null;
  publishedAt: string;
  created: string;
};

const EMPTY = {
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Fashion',
  tags: '',
  authorName: 'BD Market Team',
  status: 'published',
  featured: false,
  publishedAt: new Date().toISOString().slice(0, 10),
  metaTitle: '',
  metaDesc: '',
};

const CATEGORIES = ['Fashion', 'Style Guide', 'Festival', 'Buying Guide', 'Care Tips', 'Behind the Scenes', 'News'];

export default function PostManager({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [list, setList] = useState(posts);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => setList(posts), [posts]);
  const filtered = useMemo(() => {
    let out = list;
    if (status !== 'all') out = out.filter((p) => p.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.includes(q) ||
          (p.category || '').toLowerCase().includes(q)
      );
    }
    return out;
  }, [list, search, status]);

  const counts = {
    all: list.length,
    published: list.filter((p) => p.status === 'published').length,
    draft: list.filter((p) => p.status === 'draft').length,
  };

  async function save(nextStatus?: string) {
    if (!panel) return;
    if (!panel.title.trim()) return setErr('Title is required');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...panel, id: panel.id || undefined, status: nextStatus || panel.status }),
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
    if (!confirm('Delete this post permanently?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/posts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.filter((x) => x.id !== id));
      router.refresh();
    } catch {
      alert('Could not delete this post.');
    } finally {
      setDeleting(null);
    }
  }

  const words = panel ? panel.content.split(/\s+/).filter(Boolean).length : 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {(['all', 'published', 'draft'] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)} className={cn('chip capitalize', status === s && 'chip-active')}>
                {s}
                <span className="rounded-full bg-black/10 px-1.5 text-[12px]">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              className="input pl-9"
            />
          </div>
        </div>
        <button onClick={() => { setErr(''); setPanel({ ...EMPTY }); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New post
        </button>
      </div>

      {filtered.length ? (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="card group flex flex-col overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden bg-ink-100">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImage}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <Newspaper className="h-7 w-7 text-ink-300" />
                  </div>
                )}
                <div className="absolute left-2 top-2 flex gap-1.5">
                  {p.featured && (
                    <span className="badge border-0 bg-amber-500 text-white">
                      <Sparkles className="h-3 w-3" /> Featured
                    </span>
                  )}
                  <span
                    className={cn(
                      'badge border-0',
                      p.status === 'published' ? 'bg-emerald-600 text-white' : 'bg-ink-800/80 text-white'
                    )}
                  >
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 text-[12px] text-ink-400">
                  <span className="font-semibold text-brand-700">{p.category || 'Uncategorised'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {p.publishedAt}
                  </span>
                </div>
                <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-ink-900">
                  {p.title}
                </h3>
                {p.excerpt && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{p.excerpt}</p>}

                <div className="mt-2.5 flex items-center gap-3 text-[12px] text-ink-400">
                  <span>{p.readMinutes} min read</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {p.viewCount}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-1 border-t border-ink-100 pt-3">
                  <Link
                    href={`/blog/${p.slug}`}
                    target="_blank"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-ink-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Link>
                  <button
                    onClick={() => {
                      setErr('');
                      setPanel({
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        excerpt: p.excerpt || '',
                        content: p.content,
                        coverImage: p.coverImage || '',
                        category: p.category || 'Fashion',
                        tags: p.tags || '',
                        authorName: p.authorName,
                        status: p.status,
                        featured: p.featured,
                        publishedAt: p.publishedAt,
                        metaTitle: p.metaTitle || '',
                        metaDesc: p.metaDesc || '',
                      });
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    disabled={deleting === p.id}
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                  >
                    {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card grid place-items-center py-16 text-center">
          <Newspaper className="h-8 w-8 text-ink-300" />
          <p className="mt-3 text-[15px] font-medium text-ink-600">No posts found.</p>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit post' : 'New post'}
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
                <label className="label">Post title *</label>
                <input
                  value={panel.title}
                  onChange={(e) =>
                    setPanel({
                      ...panel,
                      title: e.target.value,
                      slug: panel.id ? panel.slug : slugify(e.target.value),
                    })
                  }
                  className="input input-lg"
                  placeholder="How to choose the perfect Panjabi for Eid"
                />
              </div>

              <div>
                <label className="label">URL slug</label>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-ink-400">/blog/</span>
                  <input
                    value={panel.slug}
                    onChange={(e) => setPanel({ ...panel, slug: e.target.value })}
                    className="input font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="label">Excerpt</label>
                <textarea
                  value={panel.excerpt}
                  onChange={(e) => setPanel({ ...panel, excerpt: e.target.value })}
                  className="textarea min-h-[70px]"
                  placeholder="A short summary shown on the blog index and in search results…"
                />
              </div>

              <div>
                <label className="label">Content</label>
                <textarea
                  value={panel.content}
                  onChange={(e) => setPanel({ ...panel, content: e.target.value })}
                  className="textarea min-h-[320px] font-mono text-[13px] leading-relaxed"
                  placeholder={'Write your article here.\n\nMarkdown is supported — use ## for headings, **bold**, and [links](https://example.com).'}
                />
                <p className="mt-1 text-[12px] text-ink-400">
                  {panel.content.length} characters · {words} words · ~{Math.max(1, Math.round(words / 200))} min read
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Cover image URL</label>
                  <input
                    value={panel.coverImage}
                    onChange={(e) => setPanel({ ...panel, coverImage: e.target.value })}
                    className="input"
                    placeholder="https://images.unsplash.com/…"
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select
                    value={panel.category}
                    onChange={(e) => setPanel({ ...panel, category: e.target.value })}
                    className="select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {panel.coverImage && (
                <div className="overflow-hidden rounded-xl border border-ink-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={panel.coverImage} alt="" className="aspect-[16/9] w-full object-cover" />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Author</label>
                  <input
                    value={panel.authorName}
                    onChange={(e) => setPanel({ ...panel, authorName: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Publish date</label>
                  <input
                    type="date"
                    value={panel.publishedAt}
                    onChange={(e) => setPanel({ ...panel, publishedAt: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tags</label>
                  <input
                    value={panel.tags}
                    onChange={(e) => setPanel({ ...panel, tags: e.target.value })}
                    className="input"
                    placeholder="eid, panjabi, style"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 p-3">
                <input
                  type="checkbox"
                  checked={panel.featured}
                  onChange={(e) => setPanel({ ...panel, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[15px] font-medium text-ink-700">Feature on homepage blog strip</span>
              </label>

              <details className="rounded-xl border border-ink-200">
                <summary className="cursor-pointer px-3 py-2.5 text-[15px] font-semibold text-ink-700">SEO settings</summary>
                <div className="space-y-3 border-t border-ink-100 p-3">
                  <div>
                    <label className="label">Meta title</label>
                    <input
                      value={panel.metaTitle}
                      onChange={(e) => setPanel({ ...panel, metaTitle: e.target.value })}
                      className="input"
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
                </div>
              </details>
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <select
                value={panel.status}
                onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                className="input h-9 w-36 py-0 text-[15px]"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
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
