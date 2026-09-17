'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Camera, Check, Loader2, Trash2, User } from 'lucide-react';
import { downscaleImage } from '@/lib/client-upload';
import { cn } from '@/lib/utils';

/**
 * Customer profile photo.
 *
 * Uploads immediately rather than waiting for the profile form's Save: the photo
 * is a standalone thing the customer can see the result of at once, and folding
 * it into the form would mean a half-saved profile if the other fields failed
 * validation.
 *
 * The image is downscaled in the browser first — a phone photo is 3–5 MB and the
 * largest place this renders is 96px, so sending the original wastes the
 * customer's data and the server's disk. The endpoint enforces its own 2 MB limit
 * and checks the actual file bytes, because a direct POST bypasses all of this.
 */
export default function AvatarUpload({
  initial,
  name,
}: {
  initial: string | null;
  name: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initial || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [failed, setFailed] = useState(false);

  const initialLetter = (name || '?').trim().charAt(0).toUpperCase();

  async function upload(file: File) {
    setErr('');
    setFailed(false);
    setBusy(true);
    try {
      // 640px covers the 96px display at 2x with room to spare.
      const optimised = await downscaleImage(file, 640);

      const body = new FormData();
      body.append('file', optimised);

      const res = await fetch('/api/customer/avatar', { method: 'POST', body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      setUrl(data.url);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove() {
    if (!confirm('Remove your profile photo?')) return;
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/customer/avatar', { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not remove the photo');
      setUrl('');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || 'Could not remove the photo');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <span className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-100 ring-2 ring-ink-200">
        {url && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="font-display text-2xl font-bold text-ink-400">{initialLetter}</span>
        )}

        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-ink-900/50 text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink-800">Profile photo</p>
        <p className="mt-0.5 text-[13px] text-ink-500">
          A square JPG, PNG or WebP. Shown next to your reviews and in your account.
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn-outline btn-sm"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
            {url ? 'Change photo' : 'Upload photo'}
          </button>

          {url && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
        </div>

        {err && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-rose-50 px-2.5 py-2 text-[13px] text-rose-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{err}</span>
          </p>
        )}
        {failed && !err && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[13px] text-amber-900">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>The saved photo could not be loaded. Upload a new one.</span>
          </p>
        )}
      </div>
    </div>
  );
}
