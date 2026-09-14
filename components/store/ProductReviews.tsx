'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, SlidersHorizontal, Star, ThumbsUp } from 'lucide-react';
import { Stars } from '@/components/store/ProductCard';
import { cn } from '@/lib/utils';

/**
 * Customer reviews with filtering, sorting and helpful votes.
 *
 * Previously every review rendered in a single undifferentiated list with a
 * static distribution bar. On a product with 50 reviews that is unusable — the
 * shopper can't find the 1-star complaints they're actually looking for.
 *
 * Filtering and sorting happen client-side over the reviews already fetched, so
 * clicking a bar is instant and costs no request.
 */

export type Review = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string | Date;
  verified?: boolean | null;
};

type SortKey = 'recent' | 'helpful' | 'high' | 'low';

const PAGE = 5;

function timeAgo(d: string | Date) {
  const then = new Date(d).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export default function ProductReviews({
  reviews,
  rating,
  reviewCount,
  ratingDist,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  ratingDist: { star: number; count: number; pct: number }[];
}) {
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('recent');
  const [visible, setVisible] = useState(PAGE);
  const [helpful, setHelpful] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const base = starFilter ? reviews.filter((r) => r.rating === starFilter) : [...reviews];
    switch (sort) {
      case 'high':
        return base.sort((a, b) => b.rating - a.rating);
      case 'low':
        return base.sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return base.sort((a, b) => (helpful[b.id] || 0) - (helpful[a.id] || 0));
      case 'recent':
      default:
        return base.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [reviews, starFilter, sort, helpful]);

  const shown = filtered.slice(0, visible);

  function vote(id: string) {
    if (voted[id]) return;
    setVoted((p) => ({ ...p, [id]: true }));
    setHelpful((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  }

  if (reviewCount === 0 || reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-12 text-center">
        <Star className="mx-auto mb-3 h-8 w-8 text-ink-300" />
        <p className="text-[15px] font-semibold text-ink-700">No reviews yet</p>
        <p className="mt-1 text-[14px] text-ink-500">
          Be the first to review this product — your feedback helps other shoppers.
        </p>
      </div>
    );
  }

  const recommendPct = Math.round(
    (reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100
  );

  return (
    <div>
      {/* ── Summary ── */}
      <div className="mb-6 grid gap-6 rounded-2xl border border-ink-200 bg-ink-50/50 p-5 sm:grid-cols-[150px_1fr]">
        <div className="text-center sm:border-r sm:border-ink-200">
          <p className="font-display text-5xl font-bold leading-none text-ink-900">
            {rating.toFixed(1)}
          </p>
          <Stars rating={rating} size={16} className="mt-2 justify-center" />
          <p className="mt-1.5 text-[13px] text-ink-500">
            {reviewCount} review{reviewCount === 1 ? '' : 's'}
          </p>
          {recommendPct > 0 && (
            <p className="mt-2 inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
              {recommendPct}% recommend
            </p>
          )}
        </div>

        <div className="space-y-1">
          {ratingDist.map((d) => {
            const active = starFilter === d.star;
            const disabled = d.count === 0;
            return (
              <button
                key={d.star}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setStarFilter(active ? null : d.star);
                  setVisible(PAGE);
                }}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition',
                  disabled ? 'cursor-default opacity-50' : 'hover:bg-white',
                  active && 'bg-white ring-1 ring-brand-400'
                )}
              >
                <span className="w-7 shrink-0 text-[13px] font-semibold text-ink-600">{d.star}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200">
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-ink-400">
                  {d.count}
                </span>
              </button>
            );
          })}
          {starFilter !== null && (
            <button
              type="button"
              onClick={() => {
                setStarFilter(null);
                setVisible(PAGE);
              }}
              className="mt-1 text-[12px] font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* ── Sort + count ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-ink-600">
          Showing{' '}
          <span className="font-semibold text-ink-900">
            {shown.length}
          </span>{' '}
          of {filtered.length}
          {starFilter !== null && ` · ${starFilter}-star only`}
        </p>

        <label className="flex items-center gap-2 text-[13px] text-ink-600">
          <SlidersHorizontal className="h-4 w-4 text-ink-400" />
          <span className="sr-only sm:not-sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setVisible(PAGE);
            }}
            className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="recent">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="high">Highest rated</option>
            <option value="low">Lowest rated</option>
          </select>
        </label>
      </div>

      {/* ── List ── */}
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-10 text-center text-[15px] text-ink-500">
          No {starFilter}-star reviews yet.
        </p>
      ) : (
        <div className="space-y-3.5">
          {shown.map((r) => (
            <article key={r.id} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[16px] font-bold text-brand-700">
                    {r.authorName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-semibold text-ink-900">
                      <span className="truncate">{r.authorName}</span>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] text-ink-400">{timeAgo(r.createdAt)}</p>
                  </div>
                </div>
                <Stars rating={r.rating} size={14} className="shrink-0" />
              </div>

              {r.title && (
                <p className="mt-3.5 text-[15px] font-bold text-ink-900">{r.title}</p>
              )}
              <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-ink-600">
                {r.body}
              </p>

              <div className="mt-3.5 flex items-center gap-3 border-t border-ink-100 pt-3">
                <button
                  type="button"
                  onClick={() => vote(r.id)}
                  disabled={!!voted[r.id]}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition',
                    voted[r.id]
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Helpful{helpful[r.id] ? ` (${helpful[r.id]})` : ''}
                </button>
                {voted[r.id] && (
                  <span className="text-[12px] text-ink-400">Thanks for your feedback</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {filtered.length > shown.length && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE)}
          className="btn-outline mt-4 w-full"
        >
          <ChevronDown className="h-4 w-4" />
          Show {Math.min(PAGE, filtered.length - shown.length)} more review
          {Math.min(PAGE, filtered.length - shown.length) === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}
