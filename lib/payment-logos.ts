/**
 * Accepted-payment method logos.
 *
 * Stored as a single JSON setting (`payment_logos` in the `payment_logos`
 * group) rather than one row per brand, so the merchant can add, remove and
 * reorder methods without a schema change.
 *
 * The storefront renders the uploaded artwork and *nothing else* — no brand
 * name, no coloured fallback badge, no card around it. A method with no `logo`
 * therefore has nothing to draw and is skipped, which is why the admin flags
 * those rows instead of pretending they will show up.
 *
 * Entries saved by an earlier version also carry `color`, `mark` and `note`.
 * Those keys are ignored on read and no longer written, so an existing
 * `payment_logos` value keeps parsing without a migration.
 */

export type PaymentLogo = {
  /** Stable id, used as the React key and for reordering. */
  id: string;
  /** Brand name. Becomes the image's alt text and the hover tooltip. */
  label: string;
  /** Uploaded logo URL. Empty means "not rendered on the storefront". */
  logo: string;
};

export const DEFAULT_PAYMENT_LOGOS: PaymentLogo[] = [
  { id: 'bkash', label: 'bKash', logo: '' },
  { id: 'nagad', label: 'Nagad', logo: '' },
  { id: 'rocket', label: 'Rocket', logo: '' },
  { id: 'upay', label: 'Upay', logo: '' },
  { id: 'sslcommerz', label: 'SSLCommerz', logo: '' },
  { id: 'visa', label: 'Visa', logo: '' },
  { id: 'mastercard', label: 'Mastercard', logo: '' },
  { id: 'amex', label: 'American Express', logo: '' },
  { id: 'cod', label: 'Cash on Delivery', logo: '' },
];

/** Sensible defaults for a brand-new method added by hand. */
export function blankPaymentLogo(index: number): PaymentLogo {
  return {
    id: `custom-${Date.now()}-${index}`,
    label: '',
    logo: '',
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
  };
}

/**
 * Parse the stored JSON. Returns the defaults when nothing has been saved yet,
 * so a fresh install shows a populated editor rather than an empty one.
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

/**
 * Only the methods that have artwork uploaded.
 *
 * The storefront renders logos and nothing else, so a method with an empty
 * `logo` would occupy a grid cell and draw nothing. Filtering here keeps that
 * decision in one place instead of at each call site.
 */
export function uploadedPaymentLogos(list: PaymentLogo[]): PaymentLogo[] {
  return list.filter((m) => Boolean(m.logo));
}

/** The settings key + group this feature is stored under. */
export const PAYMENT_LOGOS_KEY = 'payment_logos';
export const PAYMENT_LOGOS_GROUP = 'payment_logos';
