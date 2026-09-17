'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Eye, EyeOff, Info, Loader2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUploadField from '@/components/admin/settings/ImageUploadField';
import ColorPickerField from '@/components/admin/settings/ColorPickerField';

type Field = {
  key: string;
  value: string;
  type: string;
  label: string | null;
  hint?: string;
  options?: { value: string; label: string }[];
  placeholder?: string;
  rows?: number;
  /** Treated as an image: renders the uploader instead of a plain text input. */
  image?: { maxWidth?: number; accept?: string; previewClassName?: string };
  /** Treated as a colour: renders the picker instead of a plain text input. */
  color?: boolean;
};

export default function SettingsForm({
  group,
  fields,
  title,
  description,
  columns = 2,
  base = "/admin",
}: {
  group: string;
  fields: Field[];
  title: string;
  description: string;
  columns?: 1 | 2;
  /** The configured panel path, so a change to it can redirect correctly. */
  base?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  // Set when this save moved the panel, so the UI can say where it is going.
  const [moved, setMoved] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const dirty = fields.some((f) => values[f.key] !== f.value);

  async function save() {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group,
          values,
          meta: Object.fromEntries(fields.map((f) => [f.key, { type: f.type, label: f.label }])),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      /**
       * Changing the panel path moves the page the merchant is standing on.
       *
       * The panel's own links rebuild from the new value the instant it is saved,
       * so every one of them 404s until the browser is somewhere valid — and the
       * page currently open is about to stop existing too. Send them to the new
       * path with a full page load, which also guarantees middleware has seen the
       * change before the next request rather than relying on a client-side
       * navigation landing in the same second.
       */
      if (data.panelPath && data.panelPath !== base) {
        setMoved(data.panelPath);
        setTimeout(() => {
          window.location.href = data.panelPath;
        }, 900);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setValues(Object.fromEntries(fields.map((f) => [f.key, f.value])));
  }

  const isSecret = (k: string) => /secret|key|password|token|api_key/i.test(k);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>
            <p className="mt-0.5 max-w-2xl text-[15px] text-ink-500">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {moved ? (
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Panel moved — opening {moved}
              </span>
            ) : (
              saved && (
                <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )
            )}
            {dirty && !moved && (
              <button onClick={reset} className="btn-outline btn-sm">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            )}
            <button onClick={save} disabled={saving || !dirty || !!moved} className="btn-primary btn-sm">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[15px] text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          </div>
        )}

        {dirty && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800">
            <Info className="h-3.5 w-3.5 shrink-0" />
            You have unsaved changes.
          </div>
        )}
      </div>

      <div className={cn('grid gap-4', columns === 2 && 'lg:grid-cols-2')}>
        {fields.map((f) => (
          <div
            key={f.key}
            className={cn(
              'card p-4',
              (f.type === 'textarea' || f.type === 'json' || f.image || f.color) &&
                columns === 2 &&
                'lg:col-span-2'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <label className="label mb-0">{f.label || f.key}</label>
              <code className="shrink-0 rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[12px] text-ink-400">
                {f.key}
              </code>
            </div>

            <div className="mt-2">
              {f.color ? (
                <ColorPickerField
                  value={values[f.key] ?? ''}
                  onChange={(hex) => setValues((p) => ({ ...p, [f.key]: hex }))}
                  label={f.label || f.key}
                  hint={f.hint}
                  // Show the accent swatch inside the primary picker's preview so
                  // the merchant sees both colours in context at once.
                  previewAccent={
                    f.key === 'theme_primary' ? values.theme_accent : undefined
                  }
                />
              ) : f.image ? (
                <ImageUploadField
                  value={values[f.key] ?? ''}
                  onChange={(url) => setValues((p) => ({ ...p, [f.key]: url }))}
                  hint={f.hint}
                  maxWidth={f.image.maxWidth}
                  accept={f.image.accept}
                  previewClassName={f.image.previewClassName}
                  pending={values[f.key] !== f.value}
                />
              ) : f.type === 'boolean' ? (
                <button
                  onClick={() =>
                    setValues((p) => ({ ...p, [f.key]: p[f.key] === 'true' ? 'false' : 'true' }))
                  }
                  className={cn(
                    'flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-[15px] font-medium transition',
                    values[f.key] === 'true'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-ink-200 bg-white text-ink-500'
                  )}
                >
                  {values[f.key] === 'true' ? 'Enabled' : 'Disabled'}
                  <span
                    className={cn(
                      'relative h-5 w-9 rounded-full transition',
                      values[f.key] === 'true' ? 'bg-emerald-500' : 'bg-ink-300'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                        values[f.key] === 'true' ? 'left-[18px]' : 'left-0.5'
                      )}
                    />
                  </span>
                </button>
              ) : f.options ? (
                <select
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="select"
                >
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === 'textarea' || f.type === 'json' ? (
                <textarea
                  value={values[f.key] ?? ''}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className={cn('textarea', f.type === 'json' && 'font-mono text-[13px]')}
                  rows={f.rows || (f.type === 'json' ? 6 : 4)}
                  placeholder={f.placeholder}
                />
              ) : (
                <div className="relative">
                  <input
                    type={isSecret(f.key) && !revealed[f.key] ? 'password' : f.type === 'number' ? 'number' : 'text'}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    className={cn('input', isSecret(f.key) && 'pr-10 font-mono text-[13px]')}
                    placeholder={f.placeholder}
                    autoComplete="off"
                  />
                  {isSecret(f.key) && (
                    <button
                      onClick={() => setRevealed((p) => ({ ...p, [f.key]: !p[f.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                      type="button"
                    >
                      {revealed[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              )}

              {f.hint && !f.image && !f.color && (
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-400">{f.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving || !dirty} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </div>
  );
}
