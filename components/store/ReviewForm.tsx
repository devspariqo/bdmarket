'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2, Check } from 'lucide-react';

export default function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setState('loading');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, authorName: name, authorEmail: email, title, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setState('done');
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <Check className="h-5 w-5 text-emerald-700" />
        <div>
          <p className="text-[15px] font-bold text-emerald-900">Thank you for your review!</p>
          <p className="text-[13px] text-emerald-700">It will appear once approved by our team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-outline w-full sm:w-auto">
          Write a Review
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h3 className="font-bold text-ink-900">Write a Review</h3>

          <div>
            <label className="label">Your Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${s} star${s > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`h-7 w-7 transition ${
                      s <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-[13px] font-semibold text-ink-600">
                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][(hover || rating) - 1]}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="rv-name">Your Name *</label>
              <input id="rv-name" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Rahim Ahmed" />
            </div>
            <div>
              <label className="label" htmlFor="rv-email">Email *</label>
              <input id="rv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="rv-title">Review Title</label>
            <input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Great quality product!" />
          </div>

          <div>
            <label className="label" htmlFor="rv-body">Your Review *</label>
            <textarea
              id="rv-body" required value={body} onChange={(e) => setBody(e.target.value)}
              className="textarea" placeholder="Tell others about the quality, fit and delivery experience…"
            />
          </div>

          {err && <p className="text-[13px] font-semibold text-rose-600">{err}</p>}

          <div className="flex gap-2.5">
            <button type="submit" disabled={state === 'loading'} className="btn-primary">
              {state === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Submit Review'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
