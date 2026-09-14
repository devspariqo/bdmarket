/**
 * Accepted-payment method logos.
 *
 * Stored as a single JSON setting (`payment_logos` in the `payment_logos`
 * group) rather than one row per brand, so the merchant can add, remove and
 * reorder methods without a schema change.
 *
 * Every entry carries a built-in typographic fallback mark, so the footer grid
 * looks deliberate before any logo has been uploaded — and stays intact if an
 * uploaded file is later deleted.
 */

export type PaymentLogo = {
  /** Stable id, used as the React key and for reordering. */
  id: string;
  /** Brand name shown under the mark, e.g. "bKash". */
  label: string;
  /** Uploaded logo URL. Empty means "render the built-in mark". */
  logo: string;
  /** Brand colour for the built-in mark and the tile accent. */
  color: string;
  /** Text drawn in the built-in mark (kept short — it sits in a small tile). */
  mark: string;
  /** Optional caption, e.g. "Up to ৳10,000". */
  note?: string;
};

export const DEFAULT_PAYMENT_LOGOS: PaymentLogo[] = [
  { id: 'bkash', label: 'bKash', logo: '', color: '#e2136e', mark: 'bKash' },
  { id: 'nagad', label: 'Nagad', logo: '', color: '#f58220', mark: 'Nagad' },
  { id: 'rocket', label: 'Rocket', logo: '', color: '#8c3494', mark: 'Rocket' },
  { id: 'upay', label: 'Upay', logo: '', color: '#e8112d', mark: 'upay' },
  { id: 'sslcommerz', label: 'SSLCommerz', logo: '', color: '#1b9ad6', mark: 'SSL' },
  { id: 'visa', label: 'Visa', logo: '', color: '#1a1f71', mark: 'VISA' },
  { id: 'mastercard', label: 'Mastercard', logo: '', color: '#eb001b', mark: 'MC' },
  { id: 'amex', label: 'American Express', logo: '', color: '#006fcf', mark: 'AMEX' },
  { id: 'cod', label: 'Cash on Delivery', logo: '', color: '#334155', mark: 'COD' },
];

/** Sensible defaults for a brand-new method added by hand. */
export function blankPaymentLogo(index: number): PaymentLogo {
  return {
    id: `custom-${Date.now()}-${index}`,
    label: '',
    logo: '',
    color: '#334155',
    mark: '',
  };
}

function coerce(raw: any): PaymentLogo | null {
  if (!raw || typeof raw !== 'object') return null;
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const logo = typeof raw.logo === 'string' ? raw.logo.trim() : '';
  if (!label && !logo) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `p-${Math.random().toString(36).slice(2, 9)}`,
    label: label || 'Payment',
    logo,
    color: /^#[0-9a-f]{3,8}$/i.test(raw.color) ? raw.color : '#334155',
    // Derive a mark from the label so a hand-added method still renders nicely.
    mark: (typeof raw.mark === 'string' && raw.mark.trim()) || label.slice(0, 6),
    note: typeof raw.note === 'string' && raw.note.trim() ? raw.note.trim() : undefined,
  };
}

/**
 * Parse the stored JSON. Returns the defaults when nothing has been saved yet,
 * so a fresh install shows a populated grid rather than an empty one.
 */
export function parsePaymentLogos(raw: string | null | undefined): PaymentLogo[] {
  if (!raw) return DEFAULT_PAYMENT_LOGOS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PAYMENT_LOGOS;
    const list = parsed.map(coerce).filter(Boolean) as PaymentLogo[];
    // An explicitly saved empty array means "the merchant removed them all".
    return list;
  } catch {
    return DEFAULT_PAYMENT_LOGOS;
  }
}

export function serializePaymentLogos(list: PaymentLogo[]): string {
  return JSON.stringify(list);
}

/** The settings key + group this feature is stored under. */
export const PAYMENT_LOGOS_KEY = 'payment_logos';
export const PAYMENT_LOGOS_GROUP = 'payment_logos';
