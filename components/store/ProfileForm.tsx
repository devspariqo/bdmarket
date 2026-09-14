'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { BD_DISTRICTS, BD_DIVISIONS } from '@/lib/utils';

export default function ProfileForm({ customer }: { customer: any }) {
  const router = useRouter();
  const [form, setForm] = useState(customer);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setState('loading');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setState('done');
      router.refresh();
      setTimeout(() => setState('idle'), 2000);
    } catch (e: any) {
      setErr(e.message);
      setState('idle');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {err && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-[13px] font-semibold text-rose-800">{err}</p>
        </div>
      )}

      <section className="rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-4 font-display text-base font-bold text-ink-900">Personal Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Full Name</label>
            <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div>
            <label htmlFor="phone" className="label">Mobile Number</label>
            <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="01712345678" />
          </div>
          <div>
            <label htmlFor="email" className="label">Email Address</label>
            <input id="email" type="email" value={form.email} disabled className="input bg-ink-50" />
            <p className="mt-1 text-[12px] text-ink-400">Email cannot be changed. Contact support if needed.</p>
          </div>
          <div>
            <label htmlFor="gender" className="label">Gender</label>
            <select id="gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="select">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="district" className="label">District</label>
            <select id="district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="select">
              <option value="">Select district</option>
              {Object.entries(BD_DISTRICTS).map(([div, list]) => (
                <optgroup key={div} label={div}>
                  {list.map((d) => <option key={d} value={d}>{d}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="birthday" className="label">Date of Birth</label>
            <input id="birthday" type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className="input" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="mb-3 font-display text-base font-bold text-ink-900">Communication Preferences</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.acceptsMarketing}
            onChange={(e) => setForm({ ...form, acceptsMarketing: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            <span className="text-[15px] font-semibold text-ink-800">Receive promotional emails</span>
            <span className="mt-0.5 block text-[13px] text-ink-500">
              Get early access to Eid collections, sale alerts and exclusive coupon codes.
            </span>
          </span>
        </label>
      </section>

      <button type="submit" disabled={state === 'loading'} className="btn-primary">
        {state === 'loading' ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        ) : state === 'done' ? (
          <><Check className="h-4 w-4" /> Saved!</>
        ) : (
          'Save Changes'
        )}
      </button>
    </form>
  );
}
