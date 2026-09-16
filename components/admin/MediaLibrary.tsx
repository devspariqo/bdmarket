'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check, Copy, File, Image as ImageIcon, Link2, Loader2, Search, Trash2, Upload, X,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

type Media = {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  alt: string | null;
  folder: string;
  created: string;
};

function humanSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Normalise a row from `/api/admin/media` into this component's `Media` shape.
 *
 * The route returns the Prisma record, which carries `createdAt`; the type here
 * (and the server page that builds the initial list) uses `created`. Prepending
 * the raw row left `created` undefined, and `formatDate(undefined)` then threw
 * mid-render — so a *successful* upload landed on the error boundary.
 */
function toRow(m: any): Media {
  return {
    id: m.id,
    filename: m.filename,
    url: m.url,
    mimeType: m.mimeType ?? null,
    size: m.size ?? null,
    alt: m.alt ?? null,
    folder: m.folder ?? 'uploads',
    created: m.created ?? m.createdAt ?? new Date().toISOString(),
  };
}

export default function MediaLibrary({ initial }: { initial: Media[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState(initial);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'other'>('all');
  const [uploading, setUploading] = useState(false);
  const [urlPanel, setUrlPanel] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<Media | null>(null);

  /**
   * Re-sync when the server sends a fresh list (after `router.refresh()`).
   *
   * This was `useMemo(() => setList(initial), [initial])`, which calls a state
   * setter during render. That is not what `useMemo` is for: the server component
   * passes a freshly-mapped array every time, so the dependency changed on each
   * refresh and React re-rendered in a loop until the error boundary caught it —
   * which is the "Something went wrong" the admin saw after a successful upload.
   */
  useEffect(() => setList(initial), [initial]);

  const filtered = useMemo(() => {
    let out = list;
    if (filter === 'image') out = out.filter((m) => (m.mimeType || '').startsWith('image/'));
    if (filter === 'other') out = out.filter((m) => !(m.mimeType || '').startsWith('image/'));
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((m) => m.filename.toLowerCase().includes(q) || (m.alt || '').toLowerCase().includes(q));
    }
    return out;
  }, [list, search, filter]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to upload ${file.name}`);
        setList((p) => [toRow(data.media), ...p]);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function addByUrl() {
    if (!urlValue.trim()) return;
    setUploading(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setList((p) => [toRow(data.media), ...p]);
      setUrlValue('');
      setUrlPanel(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function remove(m: Media) {
    if (!confirm(`Delete ${m.filename}? Any page using this file will show a broken image.`)) return;
    setDeleting(m.id);
    try {
      const res = await fetch(`/api/admin/media?id=${m.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.filter((x) => x.id !== m.id));
      if (preview?.id === m.id) setPreview(null);
      router.refresh();
    } catch {
      alert('Could not delete this file.');
    } finally {
      setDeleting(null);
    }
  }

  function copy(m: Media, what: 'url' | 'markdown' | 'html') {
    const text =
      what === 'url'
        ? m.url
        : what === 'markdown'
        ? `![${m.alt || m.filename}](${m.url})`
        : `<img src="${m.url}" alt="${m.alt || m.filename}" />`;
    navigator.clipboard?.writeText(text);
    setCopied(`${m.id}-${what}`);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <>
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files…"
                className="input pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'image', 'other'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={cn('chip capitalize', filter === f && 'chip-active')}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setUrlPanel((v) => !v)} className="btn-outline btn-sm">
              <Link2 className="h-3.5 w-3.5" /> Add URL
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.svg"
              onChange={(e) => upload(e.target.files)}
              className="hidden"
            />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary btn-sm">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload
            </button>
          </div>
        </div>

        {urlPanel && (
          <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
            <input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://images.unsplash.com/photo-…"
              className="input"
            />
            <button onClick={addByUrl} disabled={uploading} className="btn-dark btn-sm whitespace-nowrap">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Add
            </button>
          </div>
        )}

        <p className="mt-3 text-[13px] text-ink-400">
          Uploads are saved to <code className="rounded bg-ink-100 px-1 py-0.5 font-mono">/public/uploads</code> — max
          8 MB per file. You can also paste a remote URL to reference an external image.
        </p>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((m) => {
            const isImage = (m.mimeType || '').startsWith('image/');
            return (
              <div key={m.id} className="card group overflow-hidden">
                <button
                  onClick={() => setPreview(m)}
                  className="relative block aspect-square w-full overflow-hidden bg-ink-100"
                >
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.alt || m.filename} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <File className="h-8 w-8 text-ink-300" />
                    </div>
                  )}
                </button>

                <div className="p-2.5">
                  <p className="truncate text-[13px] font-medium text-ink-800" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {humanSize(m.size)} · {formatDate(m.created)}
                  </p>

                  <div className="mt-2 flex items-center gap-0.5">
                    <button
                      onClick={() => copy(m, 'url')}
                      title="Copy URL"
                      className="grid h-7 w-7 place-items-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                    >
                      {copied === `${m.id}-url` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {isImage && (
                      <button
                        onClick={() => copy(m, 'markdown')}
                        title="Copy Markdown"
                        className="grid h-7 w-7 place-items-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                      >
                        {copied === `${m.id}-markdown` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ImageIcon className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => remove(m)}
                      disabled={deleting === m.id}
                      title="Delete"
                      className="ml-auto grid h-7 w-7 place-items-center rounded-md text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card grid place-items-center py-16 text-center">
          <ImageIcon className="h-8 w-8 text-ink-300" />
          <p className="mt-3 text-[15px] font-medium text-ink-600">No media found.</p>
          <p className="mt-1 text-[13px] text-ink-400">Upload an image or paste a URL to get started.</p>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/70 p-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={() => setPreview(null)} aria-label="Close" />
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{preview.filename}</p>
                <p className="text-[13px] text-ink-400">
                  {humanSize(preview.size)} · {preview.mimeType || 'unknown'} · {formatDate(preview.created)}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-auto bg-ink-50 p-4">
              {(preview.mimeType || '').startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.alt || preview.filename} className="mx-auto max-h-full rounded-lg object-contain" />
              ) : (
                <div className="grid place-items-center py-16">
                  <File className="h-10 w-10 text-ink-300" />
                  <p className="mt-2 text-[15px] text-ink-500">No preview available for this file type.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 p-4">
              <code className="flex-1 truncate rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 font-mono text-[13px] text-ink-600">
                {preview.url}
              </code>
              <button onClick={() => copy(preview, 'url')} className="btn-outline btn-sm">
                {copied === `${preview.id}-url` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copy URL
              </button>
              <button onClick={() => copy(preview, 'html')} className="btn-outline btn-sm">
                {copied === `${preview.id}-html` ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                Copy HTML
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
