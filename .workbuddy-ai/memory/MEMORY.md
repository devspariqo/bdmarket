# BD Market — project notes

Durable conventions for this codebase. Session-by-session detail lives in the dated
`YYYY-MM-DD.md` files; this file holds only what should survive across sessions.

## Stack
Next.js 14 App Router · React 18 · Prisma + SQLite · Tailwind · JWT auth (`jose`) · Recharts.
Admin demo login: `admin@bdmarket.com.bd` / `admin123`. Login endpoint is
`POST /api/auth/login` (not `/api/admin/auth/login`), sets cookie `bdm_session`.

## Theming — never hardcode a brand or accent colour
Both colours are merchant-editable in Settings → Appearance and flow through CSS variables.

- Primary → the `brand-*` Tailwind scale. Accent → `accent` / `accent-on` / `accent-hover`.
- Adding a themeable colour means: extend `cssVars()` in `lib/theme.ts`, add the token to
  `tailwind.config.js`, pass it from `app/layout.tsx`. All three steps, or it silently does nothing.
- **Tailwind opacity modifiers require the `<alpha-value>` form.** Use
  `rgb(var(--brand-600, 22 163 85) / <alpha-value>)`. A bare `var(--x, 34 197 108)` generates
  *nothing*, and the failure surfaces as a misleading
  `The 'focus:ring-brand-500/20' class does not exist`. 108 classes depend on this.
- Any colour a Tailwind token wraps in `rgb(... / <alpha-value>)` must be exposed as an `R G B`
  **channel triplet**, never a hex. Hence both `--accent` (hex, for inline styles) and
  `--accent-rgb` (triplet, for the token).
- Never hardcode `#006a4e` / `#f42a41` in a rendering surface — it stops responding to the
  merchant's choice. Legitimate exceptions: fallbacks in `lib/settings.ts` and `lib/theme.ts`,
  the "reset to default" anchor in `ColorPickerField`, per-banner defaults in `BannerManager`
  (that is user data, not theme), and static assets.
- Audit command that found three separate bugs:
  `grep -rnoE '#(006a4e|00553f|004a37|f42a41|d81f34)' app/ components/ lib/` — then classify each
  hit as "live surface → must be a token" or "fallback / data / asset → leave it".

## Next.js metadata gotchas
- **Do not put `icon.*` or `apple-icon.*` in `app/`.** That is Next's file-based metadata
  convention and it emits its own `<link rel="icon">` *last* and with a content hash, which
  overrides anything generated from settings. The favicon is admin-controlled via
  `site_favicon`; the static artwork lives at `public/icon.svg`.
- **Do not set `themeColor` in the static `viewport` export.** Next renders it before the dynamic
  `<head>`, and browsers honour only the *first* `theme-color` in the document. The live value is
  emitted in `RootLayout`.
- **A bare `<style>` element returned from an RSC tree is dropped by React 18.** Theme variables
  go on `style={{...}}` of `<html>` in the root layout instead.
- Icon MIME types come from `mimeForIcon()` in `lib/icons.ts` — never hardcode `image/svg+xml`,
  the admin can upload a PNG.

## Tabs and disclosure UI
Render **all** panels and toggle with the `hidden` attribute rather than
`{tab === 'x' && pane}`. Conditional rendering keeps inactive panes out of the server HTML, so
crawlers never see the specs or reviews. See `components/store/ProductTabs.tsx`.

## Uploads
`POST /api/admin/media` (multipart) writes to `public/uploads` and creates a `Media` row.
Client-side downscale + upload lives in `lib/client-upload.ts` — shared by the product image
uploader and the payment-logo manager, so behaviour stays identical.
Files are served by `app/uploads/[...path]/route.ts`, **not** Next static serving (Next snapshots
`public/` at boot). Do not remove that route.

## Settings
- `lib/settings.ts` — `getAllSettings()` (5s in-request cache), `getSiteConfig()`, and
  `getPaymentLogos()`. `setSettings()` + `invalidateSettingsCache()` on write.
- `PATCH /api/admin/settings` with `{ group, values, meta }` upserts a whole group, busts the
  cache and writes an audit log. It already `JSON.stringify`s object values, so **JSON-valued
  features need no new API route** — that is how `payment_logos` is stored.
- `SettingsForm.save()` posts the **entire** group `values` map, not just changed keys.
- Field rendering is configured in `components/admin/settings/renderGroup.tsx` via the `Meta`
  type: `hints`, `options`, `rows`, `images` (uploader), `colors` (colour picker).

## Environment gotchas (Windows + OneDrive)
- **OneDrive breaks the dev server.** It grabs freshly-written `.next` files, producing
  `EPERM`/`EBUSY: resource busy or locked, open '.next/...'` and 500s on every route. Not a code
  fault. Fix: kill node → `node scripts/clear-cache.js` → delete `tsconfig.tsbuildinfo` → restart.
- `rm -rf .next` fails closed under the sandbox safe-delete shim. Use `node scripts/clear-cache.js`
  (`npm run cache:clear`). `fs.rmSync(p, {force:true})` needs `recursive: true` or it throws
  `EISDIR` on directories.
- Start the dev server with the sandbox disabled, and expect the first compile to take ~20s.
- `curl` a route list immediately after a restart can return `000`/SIGTERM mid-compile — retry.
- `agent-browser` daemon state does **not** survive between Bash calls. Chain
  `open && sleep && eval` in one command. On heavy admin pages it SIGTERMs on the first `eval`.
  Admin auth workaround: `curl` the login API, take `bdm_session` from `set-cookie`, then
  `document.cookie='...; path=/'` in the same chain before navigating.
- Windows node resolves `/tmp` to `C:\tmp`; write scratch files to the project root instead.
- `taskkill /F /IM node.exe` (not `//F`).
