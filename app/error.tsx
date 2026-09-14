'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ServerCrash } from 'lucide-react';

/**
 * Route-level error boundary.
 *
 * In production Next.js redacts the underlying error and only gives us a
 * `digest`, so this page cannot explain *why* something failed — but it can
 * stop the user staring at a bare digest string, and it points at /api/health,
 * which does report the real cause.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the browser console and, with a monitoring tool attached, in
    // your error tracker. The server logs hold the full stack.
    console.error('[app] route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-7 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ServerCrash className="h-7 w-7" />
        </span>

        <h1 className="font-display text-xl font-bold text-ink-900">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-500">
          This page could not be loaded. It is usually a temporary problem — try again, and if it
          keeps happening the site administrator should check the server logs.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={reset} className="btn bg-brand-600 text-white hover:bg-brand-700">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <a href="/" className="btn-outline">
            Go to homepage
          </a>
        </div>

        {error.digest && (
          <p className="mt-6 border-t border-ink-100 pt-4 text-[12px] text-ink-400">
            Reference: <span className="font-mono text-ink-600">{error.digest}</span>
          </p>
        )}

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-left text-[12px] leading-relaxed text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">Administrators:</span> if this happens on every page,
            the database is usually unreachable. Visit{' '}
            <a href="/api/health" className="font-semibold underline underline-offset-2">
              /api/health
            </a>{' '}
            for the specific cause.
          </span>
        </p>
      </div>
    </div>
  );
}
