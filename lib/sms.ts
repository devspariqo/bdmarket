import { getAllSettings } from '@/lib/settings';

/**
 * SMS through the merchant's own Bangladeshi gateway.
 *
 * Same contract as `lib/email.ts`: never throws, always returns a result, and
 * every failure names the setting to check. Called from checkout, so a gateway
 * that is down must not cost an order.
 *
 * Each provider has its own request shape, and they are not interchangeable —
 * Greenweb and BulkSMSBD take query parameters, SSL Wireless wants a JSON body
 * over POST, and the rest are bespoke. Credentials come from Settings → SMS.
 *
 * I have not been able to exercise these against live gateways (that needs a
 * paid account and a Bangladeshi number), so the request shapes follow each
 * provider's published API. Treat the first real send as the test.
 */

/**
 * Result of a send attempt.
 *
 * Not a discriminated union on `ok`: the project runs with `strict: false`, so
 * `strictNullChecks` is off, `ok: true | false` collapses to `boolean`, and
 * `if (!r.ok)` stops narrowing. Optional fields behave the same either way.
 */
export type SendResult = { ok: boolean; error?: string };

export type SmsConfig = {
  enabled: boolean;
  provider: string;
  apiKey: string;
  apiUrl: string;
  senderId: string;
  notifyAdmin: boolean;
  notifyCustomer: boolean;
  adminPhone: string;
};

export function smsFromSettings(s: Record<string, string>): SmsConfig {
  return {
    enabled: s.sms_enabled === 'true',
    provider: (s.sms_provider || 'greenweb').toLowerCase(),
    apiKey: (s.sms_api_key || '').trim(),
    apiUrl: (s.sms_api_url || '').trim(),
    senderId: (s.sms_sender_id || 'BDMARKET').trim(),
    notifyAdmin: s.sms_notify_admin !== 'false',
    notifyCustomer: s.sms_notify_customer !== 'false',
    adminPhone: (s.store_phone || '').trim(),
  };
}

export function smsProblem(c: SmsConfig): string | null {
  if (!c.enabled) return 'SMS is switched off (Settings → SMS → Enable SMS).';
  if (c.provider === 'custom') {
    if (!c.apiUrl) return 'The custom gateway needs an API endpoint (Settings → SMS → Custom API Endpoint).';
    return null;
  }
  if (!c.apiKey) return 'No API key is set (Settings → SMS → API Key).';
  return null;
}

/** Normalise a Bangladeshi number to the 8801XXXXXXXXX form the gateways want. */
export function normaliseBdPhone(raw: string): string {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('0')) return '88' + digits;
  if (digits.startsWith('1') && digits.length === 10) return '880' + digits;
  return digits;
}

async function post(url: string, body: unknown, asJson: boolean, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: asJson
        ? { 'Content-Type': 'application/json', ...headers }
        : { 'Content-Type': 'application/x-www-form-urlencoded', ...headers },
      body: asJson ? JSON.stringify(body) : new URLSearchParams(body as Record<string, string>).toString(),
      signal: ctrl.signal,
    });
    return { status: res.status, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

async function get(url: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return { status: res.status, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

/** Send one SMS. Never throws. */
export async function sendSms(to: string, message: string): Promise<SendResult> {
  const cfg = smsFromSettings(await getAllSettings());
  const problem = smsProblem(cfg);
  if (problem) return { ok: false, error: problem };

  const number = normaliseBdPhone(to);
  if (!number || number.length < 11) return { ok: false, error: `"${to}" is not a usable phone number.` };

  const text = message.slice(0, 600);

  try {
    let result: { status: number; text: string };

    switch (cfg.provider) {
      // GET with query parameters. Returns "Ok: 1" style text rather than JSON.
      case 'greenweb': {
        const url =
          `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(cfg.apiKey)}` +
          `&to=${encodeURIComponent(number)}&message=${encodeURIComponent(text)}`;
        result = await get(url);
        break;
      }

      // GET with query parameters.
      case 'bulksmsbd': {
        const url =
          `http://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(cfg.apiKey)}` +
          `&type=text&number=${encodeURIComponent(number)}` +
          `&senderid=${encodeURIComponent(cfg.senderId)}&message=${encodeURIComponent(text)}`;
        result = await get(url);
        break;
      }

      // JSON POST. `csms_id` is their idempotency key, so it must be unique.
      case 'sslwireless': {
        const url = cfg.apiUrl || 'https://smsplus.sslwireless.com/api/v3/send-sms';
        result = await post(
          url,
          {
            api_token: cfg.apiKey,
            sid: cfg.senderId,
            msisdn: number,
            sms: text,
            csms_id: `bdm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          },
          true
        );
        break;
      }

      // Form POST.
      case 'banglanet': {
        const url = cfg.apiUrl || 'http://sms.banglanet.com.bd/api/send-sms';
        result = await post(
          url,
          { api_key: cfg.apiKey, sender_id: cfg.senderId, mobile: number, message: text },
          false
        );
        break;
      }

      // Anything else: POST JSON to the merchant's own endpoint and let them
      // adapt it. Documented shape, so a custom gateway has a stable contract.
      case 'custom':
      default: {
        result = await post(
          cfg.apiUrl,
          { api_key: cfg.apiKey, sender_id: cfg.senderId, to: number, message: text },
          true
        );
        break;
      }
    }

    if (result.status < 200 || result.status >= 300) {
      return { ok: false, error: `The ${cfg.provider} gateway returned HTTP ${result.status}: ${result.text.slice(0, 200)}` };
    }

    // These gateways answer 200 with an error string, so a 2xx is not proof.
    const body = result.text || '';
    if (/invalid|error|fail|not\s*found|insufficient|unauthor/i.test(body)) {
      return { ok: false, error: `The ${cfg.provider} gateway rejected the message: ${body.slice(0, 200)}` };
    }

    return { ok: true };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { ok: false, error: `The ${cfg.provider} gateway did not respond within 12 seconds.` };
    }
    return { ok: false, error: `Could not reach the ${cfg.provider} gateway: ${e?.message || e}` };
  }
}
