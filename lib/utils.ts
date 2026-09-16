// ─── Currency & Number Formatting (Bangladesh) ───

export const BDT = '৳';

export function formatPrice(amount: number, opts: { decimals?: boolean; symbol?: boolean } = {}) {
  const { decimals = false, symbol = true } = opts;
  const n = Number(amount || 0);
  const formatted = n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  return symbol ? `${BDT}${formatted}` : formatted;
}

export function formatNumber(n: number) {
  return Number(n || 0).toLocaleString('en-IN');
}

export function formatCompact(n: number) {
  const v = Number(n || 0);
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(2)} Lakh`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

export function discountPercent(price: number, compare?: number | null) {
  if (!compare || compare <= price) return 0;
  return Math.round(((compare - price) / compare) * 100);
}

// ─── Date helpers ───

/**
 * Coerce whatever a caller hands us into a usable Date, or null.
 *
 * These helpers get called with data that has been through JSON: a Prisma row
 * serialised by a route handler, a value typed into a form, or a field that was
 * simply absent. `formatDate(undefined)` used to throw
 * "Cannot read properties of undefined (reading 'getTime')" and take the whole
 * route down with it — which is how a successful media upload ended at the error
 * boundary. Returning null lets the caller show a dash instead.
 */
function toDate(d: Date | string | number | null | undefined): Date | null {
  if (d === null || d === undefined || d === '') return null;
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  d: Date | string | number | null | undefined,
  style: 'short' | 'long' | 'datetime' = 'short'
) {
  const date = toDate(d);
  if (!date) return '—';
  if (style === 'long')
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (style === 'datetime')
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeAgo(d: Date | string | number | null | undefined) {
  const date = toDate(d);
  if (!date) return '—';
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ─── Slug ───

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function orderNumber() {
  const d = new Date();
  const stamp =
    d.getFullYear().toString().slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BD${stamp}${rand}`;
}

export function trackingCode() {
  return 'BDM' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ─── Safe JSON ───

export function parseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function toCSV(rows: Record<string, any>[], headers?: string[]) {
  if (!rows.length) return '';
  const cols = headers ?? Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

// ─── BD geography ───

export const BD_DIVISIONS = [
  'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
];

export const BD_DISTRICTS: Record<string, string[]> = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj', 'Munshiganj', 'Tangail', 'Kishoreganj', 'Faridpur', 'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur'],
  Chattogram: ['Chattogram', 'Cox\'s Bazar', 'Cumilla', 'Feni', 'Noakhali', 'Lakshmipur', 'Chandpur', 'Brahmanbaria', 'Rangamati', 'Bandarban', 'Khagrachhari'],
  Rajshahi: ['Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Natore', 'Naogaon', 'Chapainawabganj', 'Joypurhat'],
  Khulna: ['Khulna', 'Jashore', 'Kushtia', 'Satkhira', 'Bagerhat', 'Jhenaidah', 'Magura', 'Narail', 'Chuadanga', 'Meherpur'],
  Barishal: ['Barishal', 'Patuakhali', 'Bhola', 'Pirojpur', 'Barguna', 'Jhalokati'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
};

export const ORDER_STATUS_FLOW = [
  'PENDING', 'PROCESSING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED',
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PACKED: 'bg-violet-100 text-violet-800 border-violet-200',
  SHIPPED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
  RETURNED: 'bg-orange-100 text-orange-800 border-orange-200',
  REFUNDED: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: 'Cash on Delivery',
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  card: 'Card',
  sslcommerz: 'SSLCommerz',
};

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Build a page <title> that will not double up the store name.
 *
 * The root layout sets a title template of `%s | BD Market`, and Next appends it
 * to whatever a page provides. But admin-edited and seeded `metaTitle` values are
 * usually *complete* titles that already end with the brand — passing one through
 * the template produced "... | BD Market | BD Market".
 *
 * So: if `metaTitle` is already branded (or already long enough to be a full
 * title), return it as an `absolute` title, which bypasses the template. Anything
 * else is returned as-is and picks up the brand suffix automatically.
 *
 * @param metaTitle the stored SEO title, if the editor set one
 * @param fallback  the plain name to use when there is no stored title
 */
export function pageTitle(
  metaTitle: string | null | undefined,
  fallback: string,
): { absolute: string } | string {
  const raw = (metaTitle || fallback || '').trim();
  if (!raw) return fallback;
  // Already carries the brand (or a pipe-separated suffix) — do not append again.
  if (/\|\s*BD Market\s*$/i.test(raw) || raw.includes('|')) {
    return { absolute: raw };
  }
  return raw;
}
