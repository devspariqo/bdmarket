'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck, Check, Loader2, ShieldAlert, Star, Trash2, Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Review = {
  id: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  ago: string;
  productName: string;
  productSlug: string | null;
};

export default function ReviewModeration({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});

  async function act(id: string, status?: string, verified?: boolean) {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, verified }),
      });
      if (!res.ok) throw new Error('Failed');
      setDone((p) => ({ ...p, [id]: status || (verified ? 'verified' : 'updated') }));
      router.refresh();
    } catch {
      alert('Could not update this review. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('Permanently delete this review?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setDone((p) => ({ ...p, [id]: 'deleted' }));
      router.refresh();
    } catch {
      alert('Could not delete this review.');
    } finally {
      setBusy(null);
    }
  }

  if (!reviews.length) {
    return (
      <div className="card grid place-items-center py-16 text-center">
        <Star className="h-8 w-8 text-ink-300" />
        <p className="mt-3 text-[15px] font-medium text-ink-600">Nothing to moderate here.</p>
        <p className="mt-1 text-[13px] text-ink-400">You&apos;re all caught up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => {
        const marked = done[r.id];
        return (
          <article key={r.id} className={cn('card p-4 transition sm:p-5', marked === 'deleted' && 'opacity-40')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 font-display text-[15px] font-bold text-brand-700">
                  {r.authorName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink-900">{r.authorName}</span>
                    {r.verified && (
                      <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700">
                        <BadgeCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    <span
                      className={cn(
                        'badge border',
                        r.status === 'approved'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : r.status === 'spam'
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="truncate text-[13px] text-ink-400">
                    {r.authorEmail} • {r.ago}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {r.title && <h3 className="font-display text-base font-semibold text-ink-900">{r.title}</h3>}
              <p className="text-[15px] leading-relaxed text-ink-600">{r.body}</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
              <Link
                href={r.productSlug ? `/product/${r.productSlug}` : '#'}
                target="_blank"
                className="text-[13px] font-medium text-brand-700 hover:underline"
              >
                on {r.productName}
              </Link>
              <span className="text-[13px] text-ink-300">•</span>
              <span className="text-[13px] text-ink-400">{r.helpful} found helpful</span>

              <div className="ml-auto flex items-center gap-1.5">
                {busy === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
                ) : marked ? (
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> {marked}
                  </span>
                ) : (
                  <>
                    {r.status !== 'approved' ? (
                      <button onClick={() => act(r.id, 'approved')} className="btn-primary btn-sm">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                    ) : (
                      <button onClick={() => act(r.id, 'pending')} className="btn-outline btn-sm">
                        <Undo2 className="h-3.5 w-3.5" /> Unpublish
                      </button>
                    )}
                    {r.status !== 'spam' && (
                      <button onClick={() => act(r.id, 'spam')} className="btn-outline btn-sm text-rose-600">
                        <ShieldAlert className="h-3.5 w-3.5" /> Spam
                      </button>
                    )}
                    <button
                      onClick={() => act(r.id, undefined, !r.verified)}
                      className="btn-outline btn-sm"
                      title="Toggle verified buyer"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
