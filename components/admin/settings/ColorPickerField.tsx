'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Pipette, RotateCcw, Shuffle, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildRamp, contrastRatio, hexToHsl, hslToHex, isValidHex, normalizeHex,
  PRESETS, readableOn, themeAdvice,
} from '@/lib/color';

/**
 * Colour picker for Settings → Appearance → Primary Color.
 *
 * Replaces the bare `<input type="text">` the field used to render. Reasons a
 * plain text box was not good enough:
 * - it accepted `red`, `#00`, `006a4e` and silently saved whatever was typed,
 *   which then got interpolated into CSS and broke the palette;
 * - it showed no hint of what the colour would actually do to the website;
 * - it was impossible to use on a phone.
 *
 * This control is valid-by-construction: every interaction path produces a
 * normalised `#rrggbb`, and the ramp preview is generated with the exact same
 * `buildRamp()` the website injector uses, so what you see is what ships.
 */
export default function ColorPickerField({
  value,
  onChange,
  label,
  hint,
  previewAccent,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
  hint?: string;
  /**
   * The sibling accent colour, shown in the preview as a sale flag and cart
   * counter. Passed only on the Primary field — the Accent field omits it so its
   * own swatch is not drawn twice.
   */
  previewAccent?: string;
}) {
  const initial = normalizeHex(value) || '#006a4e';
  const [hsl, setHsl] = useState(() => hexToHsl(initial));
  const [draft, setDraft] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const lastPushed = useRef(initial);

  // Adopt externally-driven changes (Reset button) without stomping in-progress
  // edits: only react when the incoming value differs from what we last emitted.
  useEffect(() => {
    const n = normalizeHex(value);
    if (n && n !== lastPushed.current) {
      lastPushed.current = n;
      setHsl(hexToHsl(n));
      setDraft(n);
    }
  }, [value]);

  const hex = useMemo(() => hslToHex(hsl), [hsl]);
  const ramp = useMemo(() => buildRamp(hex), [hex]);
  const advice = useMemo(() => themeAdvice(hex), [hex]);

  function push(next: string) {
    lastPushed.current = next;
    onChange(next);
  }

  function setFromHex(input: string) {
    const n = normalizeHex(input);
    if (!n) return;
    setHsl(hexToHsl(n));
    setDraft(n);
    push(n);
  }

  function setChannel(patch: Partial<typeof hsl>) {
    const next = { ...hsl, ...patch };
    setHsl(next);
    const h = hslToHex(next);
    setDraft(h);
    push(h);
  }

  const hueGradient =
    'linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)';
  const satGradient = `linear-gradient(to right,hsl(${hsl.h} 0% ${hsl.l}%),hsl(${hsl.h} 100% ${hsl.l}%))`;
  const lightGradient = `linear-gradient(to right,#000,hsl(${hsl.h} ${hsl.s}% 50%),#fff)`;
  const isDefault = hex === '#006a4e';

  async function copy() {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the value is visible in the field anyway */
    }
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white">
      {/* ── Current colour + native eyedropper ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 p-3.5">
        <div className="relative shrink-0">
          <div
            className="h-14 w-14 rounded-xl border border-ink-200 shadow-inner"
            style={{ background: hex }}
          />
          <input
            type="color"
            value={hex}
            onChange={(e) => setFromHex(e.target.value)}
            aria-label={`${label} — pick a colour`}
            className="color-swatch absolute inset-0 h-full w-full opacity-0"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-ink-200">
              <Pipette className="h-3.5 w-3.5 text-ink-500" />
            </span>
            <input
              value={draft}
              onChange={(e) => {
                const v = e.target.value;
                setDraft(v);
                const n = normalizeHex(v);
                if (n) {
                  setHsl(hexToHsl(n));
                  push(n);
                }
              }}
              onBlur={() => setDraft(hex)}
              spellCheck={false}
              aria-label={`${label} hex value`}
              className={cn(
                'w-[130px] rounded-lg border px-2.5 py-1.5 font-mono text-[14px] uppercase tracking-wide outline-none transition',
                isValidHex(draft)
                  ? 'border-ink-200 text-ink-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                  : 'border-rose-300 bg-rose-50 text-rose-700'
              )}
            />
            <button type="button" onClick={copy} className="btn-outline btn-sm" title="Copy hex">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="btn-outline btn-sm"
              aria-expanded={open}
            >
              {open ? 'Hide sliders' : 'Fine tune'}
            </button>
          </div>
          {!isValidHex(draft) && (
            <p className="mt-1.5 text-[12px] font-semibold text-rose-600">
              Not a valid hex colour — use 3 or 6 hex digits, e.g. #006a4e
            </p>
          )}
        </div>

        {!isDefault && (
          <button
            type="button"
            onClick={() => setFromHex('#006a4e')}
            className="btn-ghost btn-sm shrink-0"
            title="Back to the default Bangladesh green"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Default
          </button>
        )}
      </div>

      {/* ── HSL sliders ── */}
      {open && (
        <div className="space-y-3 border-b border-ink-100 bg-ink-50/60 p-3.5">
          {(
            [
              { key: 'h', label: 'Hue', value: hsl.h, max: 360, unit: '°', track: hueGradient },
              { key: 's', label: 'Saturation', value: hsl.s, max: 100, unit: '%', track: satGradient },
              { key: 'l', label: 'Lightness', value: hsl.l, max: 100, unit: '%', track: lightGradient },
            ] as const
          ).map((s) => (
            <div key={s.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-600">{s.label}</span>
                <span className="font-mono text-[13px] text-ink-500">
                  {Math.round(s.value)}
                  {s.unit}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={s.max}
                value={Math.round(s.value)}
                onChange={(e) => setChannel({ [s.key]: Number(e.target.value) } as any)}
                aria-label={s.label}
                className="color-slider w-full"
                style={{
                  background: s.track,
                  border: s.key === 'l' ? '1px solid #d5dae3' : undefined,
                }}
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                const { h, s } = hsl;
                setFromHex(hslToHex({ h, s, l: 30 }));
              }}
              className="btn-outline btn-sm"
              title="Nudge to a shade with reliable white-text contrast"
            >
              <Shuffle className="h-3.5 w-3.5" /> Readable shade
            </button>
            <button
              type="button"
              onClick={() => setFromHex(hslToHex({ h: hsl.h, s: 85, l: 38 }))}
              className="btn-outline btn-sm"
            >
              Vivid
            </button>
            <button
              type="button"
              onClick={() => setFromHex(hslToHex({ h: hsl.h, s: 48, l: 42 }))}
              className="btn-outline btn-sm"
            >
              Muted
            </button>
          </div>
        </div>
      )}

      {/* ── Presets ── */}
      <div className="border-b border-ink-100 p-3.5">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-400">
          Recommended palettes
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const active = p.hex.toLowerCase() === hex;
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => setFromHex(p.hex)}
                title={`${p.name} — ${p.note}`}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition',
                  active
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/30'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                )}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-md border border-black/10"
                  style={{ background: p.hex }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-ink-800">
                    {p.name}
                  </span>
                  <span className="block truncate font-mono text-[11px] text-ink-400">
                    {p.hex}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Live website preview ── */}
      <div className="p-3.5">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-400">
          Website preview
        </p>

        <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-3">
          {/* announcement bar + header stand-in */}
          <div
            className="flex h-8 items-center justify-center rounded-t-lg px-3 text-[11px] font-medium"
            style={{ background: hex, color: readableOn(hex) }}
          >
            Free delivery on orders over ৳2000
          </div>
          <div className="flex items-center justify-between rounded-b-lg border border-t-0 border-ink-200 bg-white px-3 py-2.5">
            <span className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-md" style={{ background: hex }} />
              <span className="text-[13px] font-bold text-ink-900">Your Store</span>
            </span>
            <span className="hidden gap-3 text-[12px] font-medium sm:flex">
              {['Shop', 'New in', 'Blog'].map((t, i) => (
                <span key={t} style={{ color: i === 0 ? ramp[700] : '#65748f' }}>
                  {t}
                </span>
              ))}
            </span>
          </div>

          {/* buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-semibold"
              style={{ background: hex, color: readableOn(hex) }}
            >
              Add to Cart
            </span>
            <span
              className="inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] font-semibold"
              style={{ borderColor: ramp[600], color: ramp[700] }}
            >
              Buy Now
            </span>
            <span
              className="inline-flex h-9 items-center rounded-full px-3 text-[12px] font-bold"
              style={{ background: ramp[50], color: ramp[700] }}
            >
              In stock
            </span>
            {/* The accent colour drives sale flags and counters, so show one here.
                Only meaningful on the primary field; the accent field passes its
                own colour through `previewAccent`. */}
            {previewAccent && (
              <>
                <span
                  className="inline-flex h-9 items-center rounded-md px-2.5 text-[12px] font-bold"
                  style={{ background: previewAccent, color: readableOn(previewAccent) }}
                >
                  -25%
                </span>
                <span
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white"
                  title="Cart counter uses the accent colour"
                >
                  <ShoppingBag className="h-4 w-4 text-ink-600" />
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                    style={{ background: previewAccent, color: readableOn(previewAccent) }}
                  >
                    3
                  </span>
                </span>
              </>
            )}
          </div>

          {/* ramp */}
          <div className="mt-3">
            <div className="flex h-7 overflow-hidden rounded-lg">
              {(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const).map(
                (stop) => (
                  <span key={stop} className="flex-1" style={{ background: ramp[stop] }} title={`${stop} — ${ramp[stop]}`} />
                )
              )}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-400">
              <span>50</span>
              <span>500</span>
              <span>950</span>
            </div>
          </div>
        </div>

        {/* guidance */}
        <div
          className={cn(
            'mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px]',
            advice.level === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          {advice.level === 'ok' ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>
            {advice.message}{' '}
            <span className="text-ink-500">
              (white text contrast {contrastRatio(hex, '#ffffff').toFixed(1)}:1)
            </span>
          </span>
        </div>

        {hint && <p className="mt-2.5 text-[12px] leading-relaxed text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}
