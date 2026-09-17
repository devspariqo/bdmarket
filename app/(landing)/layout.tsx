/**
 * Layout for landing pages.
 *
 * Deliberately empty. Landing pages must NOT inherit the store's header, footer,
 * nav or cart drawer — every navigation link is a way to lose a visitor who
 * arrived from a paid ad, and the entire point of the format is that the only
 * action available is buying.
 *
 * They sit in their own route group precisely so this stays true: `(store)`
 * carries the chrome, `(landing)` does not, and the root layout contributes only
 * the document, the fonts and the theme variables.
 *
 * The absence of chrome is not the absence of SEO — meta tags and tracking are
 * emitted per page in `[parent]/[slug]/page.tsx`.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
