import { Check } from 'lucide-react';

/**
 * Renders a product description as real formatted content.
 *
 * Previously the description was just `text.split('\n\n')` into `<p>` tags, so a
 * merchant who wrote a heading, a bullet list or bold text saw all of it dumped
 * as flat paragraphs. This handles the small, predictable subset of Markdown
 * that people actually type into a product description:
 *
 *   ## Heading / ### Sub-heading
 *   - bullet   (also * and •)
 *   1. numbered
 *   **bold**
 *   blank line = new block
 *
 * Anything else falls through as a paragraph, so plain prose still works
 * exactly as before. Deliberately not a full Markdown parser — pulling in a
 * dependency (and the XSS surface of raw HTML) isn't worth it here.
 */

type Block =
  | { kind: 'h'; level: 2 | 3; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'quote'; text: string };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*(#{2,4})\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;

function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    blocks.push(list.ordered ? { kind: 'ol', items: list.items } : { kind: 'ul', items: list.items });
    list = null;
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }

    const h = line.match(HEADING);
    if (h) {
      flush();
      blocks.push({ kind: 'h', level: h[1].length <= 2 ? 2 : 3, text: h[2].trim() });
      continue;
    }

    const b = line.match(BULLET);
    if (b) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(b[1].trim());
      continue;
    }

    const n = line.match(NUMBERED);
    if (n) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(n[1].trim());
      continue;
    }

    const q = line.match(QUOTE);
    if (q) {
      flush();
      blocks.push({ kind: 'quote', text: q[1].trim() });
      continue;
    }

    // A plain line: if we're mid-list, treat it as a continuation of the last
    // item rather than starting a new paragraph — that's how people write
    // wrapped bullets.
    if (list && list.items.length) {
      list.items[list.items.length - 1] += ' ' + line.trim();
      continue;
    }

    flush();
    blocks.push({ kind: 'p', text: line.trim() });
  }

  flush();
  return blocks;
}

/** `**bold**` → <strong>, and nothing else (no HTML passthrough). */
function inline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-ink-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ProductDescription({
  description,
  shortDesc,
  highlights = [],
}: {
  description?: string | null;
  shortDesc?: string | null;
  /** Extra bullet points (spec-derived) shown above the long copy. */
  highlights?: string[];
}) {
  const blocks = parseBlocks((description || '').trim());

  return (
    <div>
      {/* At-a-glance summary — the part most shoppers actually read. */}
      {(shortDesc || highlights.length > 0) && (
        <div className="mb-7 rounded-2xl border border-brand-200 bg-brand-50/50 p-5">
          <h3 className="mb-2.5 text-[15px] font-bold text-brand-900">At a glance</h3>
          {shortDesc && (
            <p className="text-[15px] leading-relaxed text-ink-700">{shortDesc}</p>
          )}
          {highlights.length > 0 && (
            <ul className="mt-3.5 grid gap-2 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-[14px] leading-relaxed text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {blocks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-10 text-center text-[15px] text-ink-500">
          No description has been added for this product yet.
        </p>
      ) : (
        // max-w keeps long-form copy readable — ~70 characters per line is the
        // comfortable range for body text.
        <div className="max-w-[68ch]">
          {blocks.map((b, i) => {
            if (b.kind === 'h') {
              const Tag = b.level === 2 ? 'h3' : 'h4';
              return (
                <Tag
                  key={i}
                  className={
                    b.level === 2
                      ? 'mb-2.5 mt-7 font-display text-[19px] font-bold text-ink-900 first:mt-0'
                      : 'mb-2 mt-5 text-[16px] font-bold text-ink-900 first:mt-0'
                  }
                >
                  {b.text}
                </Tag>
              );
            }

            if (b.kind === 'ul') {
              return (
                <ul key={i} className="my-3.5 space-y-2">
                  {b.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-600">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                      <span>{inline(it)}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            if (b.kind === 'ol') {
              return (
                <ol key={i} className="my-3.5 space-y-2">
                  {b.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-600">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12px] font-bold text-brand-800">
                        {j + 1}
                      </span>
                      <span>{inline(it)}</span>
                    </li>
                  ))}
                </ol>
              );
            }

            if (b.kind === 'quote') {
              return (
                <blockquote
                  key={i}
                  className="my-4 border-l-4 border-brand-300 bg-ink-50/60 py-2.5 pl-4 pr-3 text-[15px] italic leading-relaxed text-ink-600"
                >
                  {inline(b.text)}
                </blockquote>
              );
            }

            return (
              <p key={i} className="my-3.5 text-[15px] leading-[1.75] text-ink-600 first:mt-0">
                {inline(b.text)}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
