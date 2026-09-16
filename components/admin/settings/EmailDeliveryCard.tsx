'use client';

import { useState } from 'react';
import { AlertCircle, Check, Loader2, Mail, PlugZap, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Delivery status and connection test for the mail configuration.
 *
 * Sits above the Email settings form. The form itself cannot tell you whether
 * the values work — you find that out when a customer does not receive their
 * confirmation, which is far too late. This panel shows the resolved
 * configuration, the outcome of the last real send, and a button that exercises
 * the connection on demand.
 */
export default function EmailDeliveryCard({
  status,
  detail,
  at,
  summary,
  problem,
  defaultTo,
}: {
  status: string;
  detail: string;
  at: string;
  summary: { host: string; port: number; encryption: string; from: string; auth: boolean };
  problem: string | null;
  defaultTo: string;
}) {
  const [busy, setBusy] = useState<'verify' | 'send' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [to, setTo] = useState(defaultTo);

  async function run(mode: 'verify' | 'send') {
    setBusy(mode);
    setResult(null);
    try {
      const res = await fetch('/api/admin/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, to }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Request failed (HTTP ${res.status})`);
      setResult({ ok: !!data?.ok, text: data?.message || data?.error || 'No detail returned.' });
    } catch (e: any) {
      setResult({ ok: false, text: e?.message || 'The test could not be run.' });
    } finally {
      setBusy(null);
    }
  }

  const tone =
    status === 'sent'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : status === 'failed'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : 'border-ink-200 bg-ink-50 text-ink-700';

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-bold text-ink-900">Delivery status</h2>
          <p className="mt-0.5 text-[13px] text-ink-500">
            What the app will actually connect to, and how the last real message went.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => run('verify')}
            disabled={busy !== null}
            className="btn-outline btn-sm"
          >
            {busy === 'verify' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
            Test connection
          </button>
        </div>
      </div>

      {/* Resolved configuration — the point being to show what is really in use,
          including the port and encryption derived from the settings. */}
      <dl className="mt-4 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-500">Server</dt>
          <dd className="font-mono text-ink-800">{summary.host || '— not set —'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-500">Port</dt>
          <dd className="font-mono text-ink-800">
            {summary.port} <span className="text-ink-400">({summary.encryption})</span>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-500">From</dt>
          <dd className="truncate font-mono text-ink-800">{summary.from || '— not set —'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-ink-500">Login</dt>
          <dd className="text-ink-800">{summary.auth ? 'Username and password' : 'No authentication'}</dd>
        </div>
      </dl>

      {problem && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{problem}</span>
        </p>
      )}

      {status && (
        <div className={cn('mt-4 rounded-xl border px-3 py-2.5 text-[13px]', tone)}>
          <p className="font-semibold">
            Last attempt: {status}
            {at ? <span className="ml-2 font-normal opacity-70">{new Date(at).toLocaleString('en-GB')}</span> : null}
          </p>
          {detail && <p className="mt-1 whitespace-pre-wrap break-words">{detail}</p>}
        </div>
      )}

      <div className="mt-4 border-t border-ink-100 pt-4">
        <label className="label">Send a test message</label>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="you@example.com"
            className="input h-9 flex-1 py-0 sm:min-w-[220px]"
          />
          <button type="button" onClick={() => run('send')} disabled={busy !== null} className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700">
            {busy === 'send' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send test
          </button>
        </div>
        <p className="mt-2 text-[12px] text-ink-500">
          Connection tests and test sends are recorded above and on the order timeline of the messages they relate to.
        </p>
      </div>

      {result && (
        <p
          className={cn(
            'mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[13px]',
            result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'
          )}
        >
          {result.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="break-words">{result.text}</span>
        </p>
      )}
    </div>
  );
}
