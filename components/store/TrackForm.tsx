'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, Loader2 } from 'lucide-react';

export default function TrackForm() {
  const [num, setNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!num.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(num.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setErr(data.error || 'No order found with that number. Please check and try again.');
        setLoading(false);
        return;
      }
      router.push(`/order/${num.trim().toUpperCase()}`);
    } catch {
      setErr('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
      <label htmlFor="track" className="label">Order Number</label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          id="track"
          value={num}
          onChange={(e) => setNum(e.target.value.toUpperCase())}
          placeholder="e.g. BD26091001"
          className="input"
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0 sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Track Order
        </button>
      </div>
      {err && <p className="mt-2 text-[13px] font-semibold text-rose-600">{err}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-400">
        <Package className="h-3.5 w-3.5" /> You can find your order number in the confirmation email or SMS.
      </p>
    </form>
  );
}
