import { getAllSettings, setSettings } from '@/lib/settings';

/**
 * Transactional email over the merchant's own SMTP server.
 *
 * Everything here is deliberately failure-tolerant. This is called from the
 * checkout route, and a mail server that is down, slow or misconfigured must
 * never cost the merchant an order — so every path returns a result object
 * instead of throwing, and the transport has explicit timeouts.
 *
 * Configuration lives in the Setting table (`Settings → Email`), not in env
 * vars, so the merchant can change it without a redeploy. The last outcome is
 * written back to a Setting as well, which is what the delivery panel on that
 * page reads: an SMTP problem is otherwise invisible until someone notices the
 * confirmations stopped arriving.
 */

/**
 * Result of a send attempt.
 *
 * Deliberately not a discriminated union on `ok`. This project runs with
 * `strict: false`, so `strictNullChecks` is off and `ok: true | false` collapses
 * to `boolean` — which stops TypeScript narrowing `if (!r.ok)` and makes
 * `r.error` a compile error. Optional fields work with or without strict mode.
 */
export type SendResult = { ok: boolean; error?: string };

export type SmtpConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
  footerText: string;
  notifyAdmin: boolean;
  notifyCustomer: boolean;
  adminEmail: string;
};

/** Read the SMTP configuration out of the settings map. */
export function smtpFromSettings(s: Record<string, string>): SmtpConfig {
  const encryption = (s.smtp_encryption || 'tls').toLowerCase();
  const port = Number(s.smtp_port || (encryption === 'ssl' ? 465 : 587));

  return {
    // `!== 'false'` rather than `=== 'true'`: a key that has never been written
    // should behave like the shipped default, which is on.
    enabled: s.email_enabled !== 'false',
    host: (s.smtp_host || '').trim(),
    port: Number.isFinite(port) && port > 0 ? port : 587,
    // 465 is implicit TLS. 587 and 25 start plaintext and upgrade via STARTTLS.
    secure: encryption === 'ssl' || port === 465,
    requireTLS: encryption === 'tls',
    user: (s.smtp_username || '').trim(),
    pass: s.smtp_password || '',
    fromName: s.email_from_name || s.store_name || 'Store',
    fromAddress: (s.email_from_address || s.store_email || '').trim(),
    footerText: s.email_footer_text || '',
    notifyAdmin: s.email_notify_admin !== 'false',
    notifyCustomer: s.email_notify_customer !== 'false',
    adminEmail: (s.store_email || '').trim(),
  };
}

/**
 * Why this configuration cannot send, or null when it looks usable.
 *
 * Returned as a sentence rather than a code so it can be shown to the merchant
 * verbatim.
 */
export function smtpProblem(c: SmtpConfig): string | null {
  if (!c.enabled) return 'Transactional email is switched off (Settings → Email → Enable Transactional Email).';
  if (!c.host) return 'No SMTP host is set. Add one under Settings → Email → SMTP Host.';
  if (!c.fromAddress) return 'No From Email is set. Add one under Settings → Email → From Email.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.fromAddress)) {
    return `The From Email "${c.fromAddress}" is not a valid address.`;
  }
  if (c.port === 465 && !c.secure) return 'Port 465 needs the SSL / TLS encryption option.';
  return null;
}

/**
 * Turn a nodemailer failure into something a merchant can act on.
 *
 * The raw errors are accurate but not actionable — "Invalid login: 535 5.7.8"
 * tells you nothing about which field is wrong. Each branch names the setting to
 * check.
 */
function explain(e: any, c: SmtpConfig): string {
  const code = String(e?.code || '');
  const raw = String(e?.response || e?.message || e || 'unknown error');

  if (code === 'EAUTH' || /535|534|Invalid login|Username and Password not accepted/i.test(raw)) {
    return (
      `The SMTP server rejected the login. Check the username and password under ` +
      `Settings → Email. Gmail and Outlook require an app password, not your normal one. (${raw})`
    );
  }
  if (code === 'ECONNECTION' || code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return (
      `Could not reach ${c.host}:${c.port}. Confirm the host, the port and that the server ` +
      `allows outbound SMTP — most shared hosts block port 25 and many block 465/587. (${raw})`
    );
  }
  if (code === 'EDNS' || /ENOTFOUND|EAI_AGAIN/i.test(raw)) {
    return `The hostname "${c.host}" could not be resolved. Check the SMTP Host setting for a typo. (${raw})`;
  }
  if (/self.signed|certificate|CERT_/i.test(raw)) {
    return (
      `The server's TLS certificate could not be verified. If it is a self-hosted mail server, ` +
      `try the "None — unencrypted" option, or install a valid certificate. (${raw})`
    );
  }
  if (code === 'EENVELOPE' || /Mailbox not found|no such user|relay denied/i.test(raw)) {
    return `The server refused the recipient address. (${raw})`;
  }
  if (code === 'EMESSAGE') return `The server rejected the message content. (${raw})`;
  return `${raw}`;
}

/** Build a transport. `nodemailer` is imported lazily so it is only loaded when
 *  email is actually switched on — it is a sizeable module. */
async function transportFor(c: SmtpConfig) {
  const nodemailer = (await import('nodemailer')).default;
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.secure,
    requireTLS: c.requireTLS,
    auth: c.user ? { user: c.user, pass: c.pass } : undefined,
    // Without these a black-holed mail server holds the request open until the
    // platform's own timeout kills it — which, from the checkout, looks like the
    // order itself failed.
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
  });
}

/**
 * Record the outcome so the admin can see it.
 *
 * Best-effort: a failure to write this must never mask the send result, so any
 * error is swallowed.
 */
async function record(status: 'sent' | 'failed' | 'skipped', detail: string | null) {
  try {
    await setSettings([
      { key: 'email_last_status', value: status, group: 'email', type: 'text', label: 'Last Delivery Status' },
      { key: 'email_last_detail', value: detail || '', group: 'email', type: 'textarea', label: 'Last Delivery Detail' },
      { key: 'email_last_at', value: new Date().toISOString(), group: 'email', type: 'text', label: 'Last Attempt' },
    ]);
  } catch {
    /* the settings table is unreachable — the console line below still helps */
  }
}

/** Send one message. Never throws. */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  let cfg: SmtpConfig;
  try {
    cfg = smtpFromSettings(await getAllSettings());
  } catch (e: any) {
    return { ok: false, error: `Could not read the email settings: ${e?.message || e}` };
  }

  const problem = smtpProblem(cfg);
  if (problem) {
    console.warn('[email] not sending:', problem);
    await record('skipped', problem);
    return { ok: false, error: problem };
  }

  const recipients = (Array.isArray(opts.to) ? opts.to : [opts.to])
    .map((t) => String(t || '').trim())
    .filter((t) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t));

  if (!recipients.length) {
    const msg = 'No valid recipient address, so nothing was sent.';
    await record('skipped', msg);
    return { ok: false, error: msg };
  }

  try {
    const transport = await transportFor(cfg);
    await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromAddress}>`,
      to: recipients.join(', '),
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo || cfg.adminEmail || undefined,
    });
    await record('sent', `Sent "${opts.subject}" to ${recipients.join(', ')}`);
    return { ok: true };
  } catch (e: any) {
    const msg = explain(e, cfg);
    console.error('[email] send failed:', e?.message || e);
    await record('failed', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Open a connection and authenticate without sending anything.
 *
 * This is what the "Test connection" button calls: it isolates "the settings are
 * wrong" from "the mail was rejected", which are otherwise reported the same way.
 */
export async function verifySmtp(): Promise<{ ok: boolean; message?: string; error?: string }> {
  const cfg = smtpFromSettings(await getAllSettings());
  const problem = smtpProblem(cfg);
  if (problem) return { ok: false, error: problem };

  try {
    const transport = await transportFor(cfg);
    await transport.verify();
    return { ok: true, message: `Connected to ${cfg.host}:${cfg.port} and authenticated successfully.` };
  } catch (e: any) {
    const msg = explain(e, cfg);
    await record('failed', msg);
    return { ok: false, error: msg };
  }
}

/** Shared wrapper so every message looks like it came from the same store. */
export function emailShell(opts: { heading: string; body: string; footerText?: string; storeName: string }) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4">
    <div style="padding:20px 24px;border-bottom:1px solid #f0efee">
      <p style="margin:0;font-size:17px;font-weight:700">${escapeHtml(opts.storeName)}</p>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 14px;font-size:20px;font-weight:700">${escapeHtml(opts.heading)}</h1>
      ${opts.body}
    </div>
    ${
      opts.footerText
        ? `<div style="padding:16px 24px;border-top:1px solid #f0efee;font-size:12px;color:#78716c">${escapeHtml(opts.footerText)}</div>`
        : ''
    }
  </div>
</body></html>`;
}

export function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
