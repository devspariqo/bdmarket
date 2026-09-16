import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSiteConfig } from '@/lib/settings';
import { verifySmtp, sendMail, emailShell } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/email-test
 *
 * Two-step diagnosis of the mail configuration, because "email is not working"
 * conflates two different faults that need different fixes:
 *
 *   mode: 'verify'  — open a connection and authenticate. Proves the host, port,
 *                     encryption and credentials are right without sending.
 *   mode: 'send'    — the above, then actually deliver a message to `to`. This is
 *                     the only way to catch the faults that appear after
 *                     authentication: a From address the server refuses to send
 *                     as, a relay restriction, or a spam rejection.
 *
 * Always answers 200 with an `ok` flag, so the UI can render the detail rather
 * than treating a misconfiguration as a transport error.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const mode = body?.mode === 'send' ? 'send' : 'verify';
  const to = String(body?.to || '').trim();

  if (mode === 'send' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ ok: false, step: 'input', error: 'Enter a valid address to send the test to.' });
  }

  const connection = await verifySmtp();
  if (!connection.ok) {
    return NextResponse.json({ ok: false, step: 'connection', error: connection.error });
  }

  if (mode === 'verify') {
    return NextResponse.json({ ok: true, step: 'connection', message: connection.message });
  }

  const config = await getSiteConfig();
  const result = await sendMail({
    to,
    subject: `${config.siteName} — test email`,
    html: emailShell({
      storeName: config.siteName,
      heading: 'Your email settings work',
      body:
        '<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c">' +
        'This is a test message from your store admin. If you are reading it, order confirmations ' +
        'will reach your customers.</p>' +
        '<p style="margin:0;font-size:13px;color:#78716c">Sent from Settings → Email → Test connection.</p>',
      footerText: '',
    }),
  });

  return NextResponse.json(
    result.ok
      ? { ok: true, step: 'send', message: `Test email sent to ${to}. Check the inbox and the spam folder.` }
      : { ok: false, step: 'send', error: result.error }
  );
}
