'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react';

export default function AdminLoginForm({ base }: { base: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('admin@bdmarket.com.bd');
  const [password, setPassword] = useState('admin123');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(base);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">Sign in</h2>
        <p className="mt-1 text-[13px] text-ink-500">Enter your administrator credentials</p>
      </div>

      {err && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-[13px] font-semibold text-rose-800">{err}</p>
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">Email Address</label>
        <input
          id="email" type="email" value={email} required autoComplete="username"
          onChange={(e) => setEmail(e.target.value)}
          className="input" placeholder="admin@bdmarket.com.bd"
        />
      </div>

      <div>
        <label htmlFor="password" className="label">Password</label>
        <div className="relative">
          <input
            id="password" type={show ? 'text' : 'password'} value={password} required
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="input pr-11" placeholder="••••••••"
          />
          <button
            type="button" onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full font-bold">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : <><LogIn className="h-4 w-4" /> Sign In to Dashboard</>}
      </button>
    </form>
  );
}
