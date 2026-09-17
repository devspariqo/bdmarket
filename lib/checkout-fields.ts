/**
 * Which fields the checkout form asks for, and which of them are mandatory.
 *
 * Stored as a single JSON setting (`checkout_fields`) rather than one row per
 * field, so the merchant can reorder, relabel and toggle fields without a schema
 * change — the same reasoning as `payment-logos.ts`.
 *
 * The *keys* are fixed and not editable: each one maps to a column on `Order`
 * (`customerName`, `shipStreet`, `customerNote`, …), so an invented key would
 * have nowhere to be stored. What the merchant controls is everything a customer
 * actually sees — whether the field appears, what it is called, its placeholder,
 * and whether it is required.
 *
 * This module is imported by the admin manager, the checkout form and the order
 * endpoint. The endpoint re-reads the required list from here rather than trusting
 * the form, because a client-side required flag is editable in devtools.
 */

export type CheckoutField = {
  /** Maps to a column on Order. Fixed set — see CHECKOUT_FIELD_KEYS. */
  key: string;
  label: string;
  placeholder: string;
  show: boolean;
  required: boolean;
};

/** A stable identity for each field, and what it becomes on the order. */
export const CHECKOUT_FIELD_KEYS = [
  'customerName',
  'phone',
  'email',
  'division',
  'district',
  'area',
  'street',
  'postcode',
  'customerNote',
] as const;

export type CheckoutFieldKey = (typeof CHECKOUT_FIELD_KEYS)[number];

/**
 * The out-of-the-box form.
 *
 * Email is collected but not required — most Bangladeshi cash-on-delivery orders
 * arrive without one, and making it mandatory costs sales. The buyer's phone is
 * how the store actually confirms the order.
 */
export const DEFAULT_CHECKOUT_FIELDS: CheckoutField[] = [
  { key: 'customerName', label: 'Full name', placeholder: 'Your name', show: true, required: true },
  { key: 'phone', label: 'Mobile number', placeholder: '01712345678', show: true, required: true },
  { key: 'email', label: 'Email', placeholder: 'you@example.com', show: true, required: false },
  { key: 'division', label: 'Division', placeholder: '', show: true, required: false },
  { key: 'district', label: 'District', placeholder: '', show: true, required: true },
  { key: 'area', label: 'Area', placeholder: 'Area or thana', show: true, required: false },
  { key: 'street', label: 'Address', placeholder: 'House, road, landmark', show: true, required: true },
  { key: 'postcode', label: 'Postcode', placeholder: '', show: false, required: false },
  { key: 'customerNote', label: 'Order note', placeholder: 'Anything we should know?', show: true, required: false },
];

function coerce(raw: any, fallback: CheckoutField): CheckoutField {
  if (!raw || typeof raw !== 'object') return fallback;
  return {
    key: fallback.key,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : fallback.label,
    placeholder: typeof raw.placeholder === 'string' ? raw.placeholder : fallback.placeholder,
    show: typeof raw.show === 'boolean' ? raw.show : fallback.show,
    required: typeof raw.required === 'boolean' ? raw.required : fallback.required,
  };
}

/**
 * Parse a stored value into a complete field list.
 *
 * Merges over the defaults by key rather than trusting the stored array, so:
 * a key added to the code later appears without the merchant re-saving, a key
 * removed from the code disappears instead of lingering, and a half-written value
 * cannot leave the checkout missing a field it needs to place an order.
 *
 * A hidden field is never required — otherwise the form would demand something it
 * never renders and no order could be placed.
 */
export function parseCheckoutFields(raw: unknown): CheckoutField[] {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }
  const stored = Array.isArray(value) ? value : [];
  const byKey = new Map<string, any>();
  for (const item of stored) {
    if (item && typeof item === 'object' && typeof (item as any).key === 'string') {
      byKey.set((item as any).key, item);
    }
  }

  const merged = DEFAULT_CHECKOUT_FIELDS.map((fallback) => {
    const field = coerce(byKey.get(fallback.key), fallback);
    return field.show ? field : { ...field, required: false };
  });

  // Keep the merchant's ordering for the fields that are present.
  const order = stored
    .map((s: any) => (s && typeof s === 'object' ? s.key : null))
    .filter((k: any): k is string => typeof k === 'string');
  if (order.length) {
    merged.sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  return merged;
}

/** The fields to render, in order. */
export function visibleCheckoutFields(fields: CheckoutField[]): CheckoutField[] {
  return fields.filter((f) => f.show);
}

/** The keys the server insists on. */
export function requiredCheckoutKeys(fields: CheckoutField[]): string[] {
  return fields.filter((f) => f.show && f.required).map((f) => f.key);
}

/**
 * Whether an email is being collected at all.
 *
 * The order endpoint uses this to decide whether to insist on a valid address,
 * and the confirmation email needs a recipient.
 */
export function collectsEmail(fields: CheckoutField[]): boolean {
  return visibleCheckoutFields(fields).some((f) => f.key === 'email');
}
