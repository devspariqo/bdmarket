'use client';

import { useRef, useState } from 'react';
import { AlertCircle, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Inline image uploader for settings fields holding a path/URL.
 *
 * Uploads through POST /api/admin/media (multipart), which writes to
 * `public/uploads` and returns `{ media: { url } }`. The URL is then handed
 * back to SettingsForm, which persists it with the rest of the group.
 *
 * Accepts a `maxWidth` so logos don't get stored at print resolution — the
 * header renders one at <=190px, so anything bigger just costs bandwidth.
 */
export default function ImageUploadField({
  value,
  onChange,
  label,
  hint,
  accept = 'image/*',
  maxWidth = 1200,
  previewClassName = 'h-16',
  /** Set by the parent once the field differs from the saved value. */
  pending = false,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  accept?: string;
  maxWidth?: number;
  previewClassName?: string;
  pending?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [failed, setFailed] = useState(false);

  /**
   * Downscale client-side before upload. Keeps a 431 KB hero-sized logo from
   * landing in the header, and works for any raster type the browser decodes.
   * SVG is passed through untouched (resizing would rasterise it).
   */
  async function downscale(file: File): Promise<File> {
    if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) return file;
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width <= maxWidth) return file;

      const scale = maxWidth / bitmap.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();

      // PNGs that are fully opaque (no transparency) compress far better as JPEG,
      // which matters a lot for a header logo. Keep PNG only when alpha is real.
      let hasAlpha = false;
      if (file.type === 'image/png') {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 250) {
            hasAlpha = true;
            break;
          }
        }
      }

      const outType =
        file.type === 'image/png' ? (hasAlpha ? 'image/png' : 'image/jpeg') : 'image/jpeg';
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, outType, outType === 'image/jpeg' ? 0.88 : undefined)
      );
      if (!blob || blob.size >= file.size) return file;
      const ext = outType === 'image/png' ? 'png' : 'jpg';
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: outType });
    } catch {
      return file; // decoding unsupported (e.g. webp on old Safari) — send as-is
    }
  }

  async function upload(file: File) {
    setErr('');
    setFailed(false);

    const MAX = 8 * 1024 * 1024;
    if (file.size > MAX) {
      setErr('File is larger than 8 MB. Please choose a smaller image.');
      return;
    }

    setBusy(true);
    try {
      const optimized = await downscale(file);
      const body = new FormData();
      body.append('file', optimized);

      const res = await fetch('/api/admin/media', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const url = data?.media?.url;
      if (!url) throw new Error('Upload succeeded but no URL was returned');
      onChange(url);
    } catch (e: any) {
      setErr(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const hasImage = !!value && !failed;

  return (
    <div>
      {label && <label className="label mb-0">{label}</label>}

      {/* Uploads land immediately, but the setting only changes on Save. Say so,
          otherwise it looks like the upload silently did nothing. */}
      {pending && (
        <p className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] font-semibold text-amber-800">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Uploaded — click <span className="font-bold">Save changes</span> to apply it to the store.
        </p>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        className={cn(
          'mt-2 rounded-xl border border-dashed p-3 transition',
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-ink-50/60'
        )}
      >
        <div className="flex items-start gap-3">
          {/* Preview */}
          <div
            className={cn(
              'flex w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-white',
              previewClassName
            )}
          >
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt="Logo preview"
                className="h-full w-full object-contain p-1"
                onError={() => setFailed(true)}
              />
            ) : (
              <span className="flex flex-col items-center gap-1 text-ink-300">
                <ImageIcon className="h-5 w-5" />
                <span className="text-[12px] font-medium">No image</span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="btn-outline btn-sm"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {busy ? 'Uploading…' : hasImage ? 'Replace' : 'Upload image'}
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setFailed(false);
                  }}
                  className="btn-sm inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-400">
              PNG, JPG, WebP or SVG · max 8 MB
              {maxWidth ? ` · resized to ${maxWidth}px wide` : ''}
            </p>

            {/* Fallback manual path entry */}
            <input
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setFailed(false);
              }}
              placeholder="/uploads/logo.png or https://…"
              className="input mt-2 py-1.5 font-mono text-[12px]"
              aria-label="Image path"
            />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </div>

      {failed && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-amber-600">
          <AlertCircle className="h-3.5 w-3.5" /> That image could not be loaded — re-upload or fix the path.
        </p>
      )}
      {err && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" /> {err}
        </p>
      )}
      {hint && !err && !failed && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-400">{hint}</p>
      )}
    </div>
  );
}
