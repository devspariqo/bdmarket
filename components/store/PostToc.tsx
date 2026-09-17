'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TocHeading } from '@/lib/toc';

/**
 * Collapsible table of contents.
 *
 * Collapsed by default and opened by the "Show contents" button at the top of the
 * article — a long outline pushes the actual opening paragraph off the screen,
 * which is the opposite of what a reader wants on arrival.
 *
 * It also highlights the section currently on screen. That is the part that makes
 * a TOC worth having on a long article: it answers "where am I" without a scroll,
 * and it is why this is a client component rather than a static list.
 */
export default function PostToc({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Track the section in view. `rootMargin` biases the trigger towards the top of
  // the viewport, so a heading counts as "current" once it reaches the reading
  // line rather than when it first peeks in from the bottom.
  useEffect(() => {
    if (!open || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [open, headings]);

  if (headings.length < 2) return null;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <List className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="flex-1 text-[14px] font-bold text-ink-900">
          {open ? 'Hide contents' : 'Show contents'}
        </span>
        <span className="text-[12px] font-semibold text-ink-400">{headings.length}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <nav className="border-t border-ink-100 px-2 pb-3 pt-2">
          <ol className="space-y-0.5">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={() => setActiveId(h.id)}
                  className={cn(
                    'block rounded-lg py-1.5 text-[13px] leading-snug transition',
                    h.level === 3 ? 'pl-7 pr-3' : 'pl-3 pr-3 font-semibold',
                    activeId === h.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  )}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
