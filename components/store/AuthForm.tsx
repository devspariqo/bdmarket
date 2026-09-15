'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, Store, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthForm({ mode, siteName }: { mode: 'login' | 'register'; siteName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', terms: mode === 'register' ? false : true });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');

    if (mode === 'register') {
      if (!form.name.trim()) return setErr('Please enter your full name');
      if (!form.phone.trim()) return setErr('Please enter your mobile number');
      if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(form.phone.replace(/[\s-]/g, '')))
        return setErr('Enter a valid Bangladeshi mobile number');
      if (form.password.length < 6) return setErr('Password must be at least 6 characters');
      if (form.password !== form.confirm) return setErr('Passwords do not match');
      if (!form.terms) return setErr('Please accept the Terms & Conditions');
    }

    setLoading(true);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/customer/login' : '/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      router.push(redirect);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  }

  const inp = (id: string, label: string, key: keyof typeof form, props: any = {}) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="input"
        {...props}
      />
    </div>
  );

  return (
    /* Single centred column. The sign-in card used to sit beside a full-height
       marketing panel with a stock photo; the form now owns the page and stays
       centred at every width. */
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Store className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="font-display text-xl font-bold text-ink-900">{siteName}</span>
          </Link>

          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-2 text-[15px] text-ink-500">
            {mode === 'login'
              ? 'Sign in to track orders, save your wishlist and check out faster.'
              : 'Join thousands of shoppers across Bangladesh. It takes 30 seconds.'}
          </p>

          {err && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-[13px] font-semibold text-rose-800">{err}</p>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                {inp('name', 'Full Name', 'name', { placeholder: 'Rahim Ahmed', autoComplete: 'name', required: true })}
                {inp('phone', 'Mobile Number', 'phone', { type: 'tel', placeholder: '01712345678', autoComplete: 'tel', required: true })}
              </>
            )}

            {inp('email', 'Email Address', 'email', { type: 'email', placeholder: 'you@example.com', autoComplete: 'email', required: true })}

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  className="input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                {inp('confirm', 'Confirm Password', 'confirm', { type: 'password', placeholder: '••••••••', autoComplete: 'new-password', required: true })}
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.terms}
                    onChange={(e) => setForm((f) => ({ ...f, terms: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-[13px] leading-relaxed text-ink-600">
                    I agree to the{' '}
                    <Link href="/pages/terms" className="font-semibold text-brand-700 underline">Terms</Link> and{' '}
                    <Link href="/pages/privacy-policy" className="font-semibold text-brand-700 underline">Privacy Policy</Link>
                  </span>
                </label>
              </>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-[13px] text-ink-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-[13px] font-semibold text-brand-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full font-bold">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Please wait…</>
              ) : mode === 'login' ? (
                <>Sign In <ArrowRight className="h-4 w-4" /></>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[15px] text-ink-500">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <Link href="/register" className="font-bold text-brand-700 hover:underline">Create one</Link>
              </>
            ) : (
              <>Already have an account?{' '}
                <Link href="/login" className="font-bold text-brand-700 hover:underline">Sign in</Link>
              </>
            )}
          </p>

          <div className="mt-6 border-t border-ink-100 pt-6">
            <Link href="/checkout" className="btn-outline w-full">
              Continue as guest →
            </Link>
          </div>

          {mode === 'login' && (
            <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50/70 p-3.5">
              <p className="text-[12px] font-bold uppercase tracking-wide text-ink-500">Demo Customer Login</p>
              <p className="mt-1.5 font-mono text-[12px] text-ink-600">rahim@example.com / customer123</p>
            </div>
          )}
      </div>
    </div>
  );
}
