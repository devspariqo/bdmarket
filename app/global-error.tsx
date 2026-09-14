'use client';

/**
 * Last-resort error boundary.
 *
 * `app/error.tsx` does not catch failures thrown by the root layout itself, and
 * the root layout is where the theme settings are read — so a database outage
 * can take the layout down with it. This catches that case. It must render its
 * own <html> and <body>, because it replaces the root layout entirely, and it
 * deliberately avoids any app CSS variables or components that depend on them.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f6f7f9',
          color: '#1f2533',
          fontFamily:
            "Inter, 'Hind Siliguri', system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: '32rem',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #d5dae3',
            borderRadius: '16px',
            padding: '28px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
            The store could not start
          </h1>
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#505d76', margin: '0 0 20px' }}>
            A problem prevented the site from loading. If you are the administrator, check that
            your database is configured and reachable.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              border: 'none',
              borderRadius: '12px',
              background: '#006a4e',
              color: '#ffffff',
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>

          <p style={{ marginTop: '18px', fontSize: '13px' }}>
            <a href="/api/health" style={{ color: '#006a4e', fontWeight: 600 }}>
              Run the health check
            </a>
          </p>

          {error.digest && (
            <p style={{ marginTop: '14px', fontSize: '12px', color: '#8492aa' }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
