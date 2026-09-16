'use client';

import { useCallback, useRef, useState } from 'react';
import {
  AlertCircle, GripVertical, Images, Link2, Loader2, Plus, Star, Trash2, Upload, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_UPLOAD_BYTES, uploadImage } from '@/lib/client-upload';

/**
 * Product image manager for the admin product editor.
 *
 * Replaces the old "paste a URL" input. Supports:
 *  - drag & drop or file-picker upload (multi-select), via POST /api/admin/media
 *  - client-side downscale so a 5 MB phone photo doesn't become the product hero
 *  - reorder by drag (first image is the main photo) plus a one-click "make main"
 *  - multiple uploads at once with genuine per-file progress and per-file errors
 *  - paste-a-URL fallback for images already hosted elsewhere
 *
 * The uploaded URLs are held in local state only; they persist when the editor
 * saves the product, which is why the "click Save" reminder is shown.
 */

const MAX_WIDTH = 1400; // 4:5 grid cells render <=400px, 3x for retina

export default function ProductImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  // Alts are kept in React state so an upload doesn't lose what was typed.
  const [alts, setAlts] = useState<Record<string, string>>({});

  const push = useCallback(
    (url: string) => {
      if (!url) return;
      onChange([...images, url]);
    },
    [images, onChange]
  );

  async function handleFiles(files: FileList | File[]) {
    setErrors([]);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      setErrors(['Those files are not images. Use PNG, JPG, WebP or SVG.']);
      return;
    }

    const tooBig = list.filter((f) => f.size > MAX_UPLOAD_BYTES);
    if (tooBig.length) {
      setErrors([`${tooBig.length} file(s) larger than 8 MB were skipped.`]);
    }

    const usable = list.filter((f) => f.size <= MAX_UPLOAD_BYTES);
    setBusy(usable.length);

    // Sequential rather than parallel: keeps the media library ordering
    // predictable and avoids hammering the endpoint with 10 requests at once.
    const added: string[] = [];
    const failed: string[] = [];
    for (const file of usable) {
      try {
        added.push(await uploadImage(file, MAX_WIDTH));
      } catch (e: any) {
        failed.push(`${file.name}: ${e.message || 'upload failed'}`);
      } finally {
        setBusy((n) => Math.max(0, n - 1));
      }
    }

    if (added.length) onChange([...images, ...added]);
    if (failed.length) setErrors((p) => [...p, ...failed]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  function makeMain(i: number) {
    if (i === 0) return;
    const next = [...images];
    const [moved] = next.splice(i, 1);
    onChange([moved, ...next]);
  }

  /** Drag-and-drop reorder. */
  function dropAt(target: number) {
    if (dragIndex === null || dragIndex === target) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    onChange(next);
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy > 0}
          className="btn bg-brand-600 text-white hover:bg-brand-700"
        >
          {busy > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy > 0 ? `Uploading ${busy}…` : 'Upload images'}
        </button>
        <button type="button" onClick={() => setUrlOpen((v) => !v)} className="btn-outline">
          <Link2 className="h-4 w-4" /> Add by URL
        </button>
        {images.length > 0 && (
          <span className="text-[13px] text-ink-500">
            {images.length} image{images.length === 1 ? '' : 's'} · drag to reorder
          </span>
        )}
      </div>

      {urlOpen && (
        <div className="mb-4 flex gap-2">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                push(urlDraft.trim());
                setUrlDraft('');
              }
            }}
            className="input text-[13px]"
            placeholder="https://example.com/photo.jpg"
          />
          <button
            type="button"
            onClick={() => {
              push(urlDraft.trim());
              setUrlDraft('');
            }}
            className="btn-dark btn-sm shrink-0"
          >
            Add
          </button>
        </div>
      )}

      {/* Drop zone — always visible so the empty state is self-explanatory. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-2xl border border-dashed p-4 transition',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-ink-50/50'
        )}
      >
        {images.length === 0 ? (
          <div className="py-10 text-center">
            <Images className="mx-auto mb-3 h-9 w-9 text-ink-300" />
            <p className="text-[15px] font-semibold text-ink-700">
              Drag &amp; drop product photos here
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              or click <span className="font-semibold">Upload images</span> · PNG, JPG, WebP or SVG · max 8 MB each
              <br />
              The first image becomes the main product photo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <div
                key={`${img}-${i}`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dropAt(i);
                }}
                className={cn(
                  'group relative cursor-grab overflow-hidden rounded-xl border bg-white transition active:cursor-grabbing',
                  overIndex === i && dragIndex !== null && dragIndex !== i
                    ? 'border-brand-500 ring-2 ring-brand-500/30'
                    : 'border-ink-200'
                )}
              >
                <div className="aspect-[4/5]">
                  {/* `draggable={false}` matters: an <img> is natively draggable,
                      so without it the browser starts an image drag instead of
                      the tile drag, and the tile's onDrop never fires — which is
                      why dragging to reorder did nothing. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={alts[img] || ''} draggable={false} className="h-full w-full object-cover" />
                </div>

                {/* Drag affordance */}
                <span className="absolute left-1.5 top-1.5 rounded bg-black/45 p-1 text-white opacity-0 transition group-hover:opacity-100">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>

                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white">
                    MAIN
                  </span>
                )}

                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeMain(i)}
                      title="Use as main photo"
                      aria-label="Use as main photo"
                      className="rounded-lg bg-white/90 p-1.5 text-ink-700 backdrop-blur transition hover:text-brand-700"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    title="Remove image"
                    aria-label="Remove image"
                    className="rounded-lg bg-white/90 p-1.5 text-rose-600 backdrop-blur transition hover:bg-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <input
                  value={alts[img] || ''}
                  onChange={(e) => setAlts((p) => ({ ...p, [img]: e.target.value }))}
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${i + 1}`}
                  className="w-full border-t border-ink-100 px-2 py-1.5 text-[12px] text-ink-700 outline-none placeholder:text-ink-300 focus:bg-brand-50/40"
                />
              </div>
            ))}

            {/* Inline add tile keeps the grid rhythm while uploading. */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy > 0}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-ink-300 text-ink-400 transition hover:border-brand-500 hover:text-brand-600"
            >
              {busy > 0 ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span className="text-[12px] font-semibold">Add</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
        }}
      />

      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-amber-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Uploads are saved to the media library immediately — click{' '}
        <span className="font-bold">Save product</span> to attach them.
      </p>

      {errors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {errors.map((e, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
