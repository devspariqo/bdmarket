import { buildRamp, hexToRgb, hoverShade, readableOn } from '@/lib/color';

/**
 * Turns the merchant's Appearance colours into the CSS custom properties that
 * drive the Tailwind palette.
 *
 * Why this is a helper and not a `<style>` component: React 18's server
 * renderer drops a bare `<style>` element emitted from an RSC tree, so the
 * variables never reached the browser. The root layout instead spreads the
 * returned object onto `style={{ ...cssVars(...) }}` on `<html>`, which React
 * serialises into a real `style` attribute — always rendered, and available
 * before first paint so there is no flash of the default palette.
 *
 * Brand stops are emitted as `R G B` triplets, not hex, because Tailwind
 * compiles `focus:ring-brand-500/20` to `rgb(var(--brand-500) / 0.2)`. The
 * config wraps each variable in `rgb(... / <alpha-value>)` to make that work;
 * a hex value there would make the 108 opacity-modified brand classes in this
 * app silently stop compiling.
 *
 * Two independent colours are supported. `primaryColor` drives the brand ramp;
 * `accentColor` is a single flat colour used for sale flags, cart counters and
 * notification dots — it needs no ramp, just a hover shade and a readable
 * foreground.
 */
export function cssVars(
  primary?: string | null,
  accent?: string | null
): Record<string, string> {
  const ramp = buildRamp(primary || '#006a4e');
  const accentHex = accent || '#f42a41';

  const channels = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    return `${r} ${g} ${b}`;
  };

  return {
    '--brand-50': channels(ramp[50]),
    '--brand-100': channels(ramp[100]),
    '--brand-200': channels(ramp[200]),
    '--brand-300': channels(ramp[300]),
    '--brand-400': channels(ramp[400]),
    '--brand-500': channels(ramp[500]),
    '--brand-600': channels(ramp[600]),
    '--brand-700': channels(ramp[700]),
    '--brand-800': channels(ramp[800]),
    '--brand-900': channels(ramp[900]),
    '--brand-950': channels(ramp[950]),
    '--ink-900': channels(ramp.ink900),
    '--ink-950': channels(ramp.ink950),
    // Hex form, for the raw CSS declaration in globals.css that reads it
    // directly (`outline: 2px solid var(--brand)`).
    '--brand': ramp[600],
    // Accent — flat colour plus the two derived values the UI needs.
    // The hex forms are what components read directly (inline `style={{}}`);
    // the `-rgb` triplets exist so Tailwind's `bg-accent` / `hover:bg-accent-hover`
    // compile to a *valid* `rgb(<channels> / <alpha>)` rather than `rgb(#ff6600 / 1)`.
    '--accent': accentHex,
    '--accent-rgb': channels(accentHex),
    '--accent-hover': hoverShade(accentHex),
    '--accent-hover-rgb': channels(hoverShade(accentHex)),
    '--accent-on': readableOn(accentHex),
  };
}

/** The serialised `style` attribute content, for use outside React. */
export function cssVarsString(primary?: string | null, accent?: string | null): string {
  return Object.entries(cssVars(primary, accent))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}
