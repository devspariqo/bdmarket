/**
 * Build a table of contents from an article's HTML.
 *
 * The content is merchant-authored HTML with no ids on its headings, so anchors
 * have nothing to jump to. This finds the h2/h3 headings, gives each a stable id,
 * and returns both the rewritten HTML and the outline the TOC renders.
 *
 * Done on the server, in one pass, rather than by walking the DOM in the browser:
 * the ids must be in the server-rendered HTML for an anchor link to work on first
 * paint, and a client pass would also make the outline invisible to a crawler.
 *
 * Deliberately regex rather than a parser. The input is a controlled subset —
 * headings the merchant typed into the editor — and pulling in an HTML parser to
 * run on every article view is a poor trade. Anything it cannot match is left
 * exactly as it was, so the worst case is a missing TOC entry, never damaged
 * content.
 */

export type TocHeading = { id: string; text: string; level: 2 | 3 };

/** Anchor-safe slug. Keeps non-Latin text, which a Bengali article needs. */
function slugify(text: string, fallback: string): string {
  const slug = text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
  return slug || fallback;
}

/**
 * Add ids to a article's headings and return its outline.
 *
 * Headings that already carry an `id` keep it — a hand-authored anchor must not be
 * rewritten, or links the merchant published would break.
 */
export function buildToc(html: string): { html: string; headings: TocHeading[] } {
  if (!html) return { html, headings: [] };

  const headings: TocHeading[] = [];
  const used = new Set<string>();

  const out = html.replace(
    /<(h2|h3)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,
    (match, tag: string, attrs = '', inner: string) => {
      const level = tag.toLowerCase() === 'h2' ? 2 : 3;
      const text = inner.replace(/<[^>]+>/g, '').trim();
      if (!text) return match;

      const existing = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs || '');
      let id = existing ? existing[1] : slugify(text, `section-${headings.length + 1}`);

      // Two headings with the same text would otherwise share an anchor, and the
      // link would always land on the first one.
      if (!existing) {
        const base = id;
        let n = 2;
        while (used.has(id)) id = `${base}-${n++}`;
      }
      used.add(id);

      headings.push({ id, text, level });

      if (existing) return match;
      return `<${tag}${attrs || ''} id="${id}">${inner}</${tag}>`;
    }
  );

  return { html: out, headings };
}

/**
 * An approximate reading time, for when the stored value is missing.
 *
 * 200 words per minute is the usual figure for English; Bengali runs a little
 * slower but the difference is not worth a separate constant for a number that is
 * always an estimate.
 */
export function readingMinutes(html: string): number {
  const words = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
