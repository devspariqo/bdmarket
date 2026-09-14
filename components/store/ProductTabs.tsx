'use client';

import { useState, type ReactNode } from 'react';
import { FileText, ListChecks, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Description / Specifications / Reviews tabs for the product page.
 *
 * All three panes are always rendered and the inactive ones are hidden with the
 * `hidden` attribute rather than being unmounted. That matters for two reasons:
 *  1. SEO — specs and reviews are in the initial HTML, so a crawler that doesn't
 *     execute JS still sees the full product content, not just the description.
 *  2. Cost — switching tabs is a class toggle, not a re-render of a potentially
 *     long review list.
 *
 * The panes are passed in as already-rendered nodes, so the description parser
 * and spec grouping run on the server and only the tab state ships to the client.
 *
 * On mobile the tab strip scrolls horizontally rather than wrapping, so three
 * tabs always sit on one line.
 */
export default function ProductTabs({
  description,
  specs,
  reviews,
  reviewCount = 0,
}: {
  description: ReactNode;
  specs: ReactNode;
  reviews: ReactNode;
  reviewCount?: number;
}) {
  const [tab, setTab] = useState<'description' | 'specs' | 'reviews'>('description');

  const tabs = [
    { key: 'description' as const, label: 'Description', icon: FileText, panel: description },
    { key: 'specs' as const, label: 'Specifications', icon: ListChecks, panel: specs },
    { key: 'reviews' as const, label: 'Reviews', icon: Star, badge: reviewCount, panel: reviews },
  ];

  return (
    <div>
      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Product details"
        className="-mx-4 mb-7 flex gap-1 overflow-x-auto border-b border-ink-200 px-4 sm:mx-0 sm:px-0"
      >
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              id={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-[15px] font-semibold transition',
                active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                    active ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-600'
                  )}
                >
                  {t.badge}
                </span>
              )}
              {/* Active underline sits on the container's bottom border. */}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`panel-${t.key}`}
          aria-labelledby={`tab-${t.key}`}
          hidden={tab !== t.key}
          tabIndex={0}
          className="focus:outline-none"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
