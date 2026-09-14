import { notFound } from 'next/navigation';
import { getSettingsGroup } from '@/lib/settings';
import SettingsForm from '@/components/admin/SettingsForm';

/**
 * Shared renderer for every /admin/settings/[group] page.
 * Field metadata (labels, hints, selects) is defined per group below.
 */

type Meta = {
  title: string;
  description: string;
  columns?: 1 | 2;
  hints?: Record<string, string>;
  options?: Record<string, { value: string; label: string }[]>;
  placeholders?: Record<string, string>;
  rows?: Record<string, number>;
  /** Keys rendered with the image uploader instead of a plain text input. */
  images?: Record<string, { maxWidth?: number; accept?: string; previewClassName?: string }>;
  /** Keys rendered with the colour picker instead of a plain text input. */
  colors?: string[];
};

/** Keys that should always be treated as colours, regardless of group. */
const COLOR_KEY = /(^|_)(color|colour|hex)(_|$)/i;

export const SETTINGS_META: Record<string, Meta> = {
  general: {
    title: 'General Settings',
    description: 'Core store identity — name, tagline, contact details and maintenance mode.',
    hints: {
      site_url: 'Used for canonical URLs, sitemap and structured data. Update this before going live.',
      site_logo:
        'Shown in the storefront header, the footer and the admin sidebar. When set, it replaces the site name text. A transparent PNG, WebP or SVG works best; wide logos display around 190px.',
      site_favicon:
        'The little icon in the browser tab and on the phone home screen. Upload a square PNG or SVG at least 256×256 — it appears immediately after saving, no rebuild needed. Leave empty to use the built-in BD Market icon.',
      store_whatsapp: 'Include the country code, e.g. +8801700000000. Used for the floating chat button.',
      maintenance_mode: 'When on, the storefront shows a maintenance notice. Admin stays accessible.',
    },
    images: {
      // The header renders the logo at <=190px and the footer at <=180px, so 3x for
      // retina is ~600px. Anything wider is pure page weight.
      site_logo: { maxWidth: 600, previewClassName: 'h-20' },
      // Square by nature — 256 covers the 180px apple-touch and 512 manifest sizes.
      site_favicon: { maxWidth: 512, accept: 'image/png,image/webp,image/jpeg,image/svg+xml,.svg,image/*', previewClassName: 'h-20' },
    },
  },
  store: {
    title: 'Store Settings',
    description: 'Currency, locale, catalogue pagination and VAT configuration.',
    hints: {
      store_currency: 'Bangladeshi Taka is the default. Changing this does not convert existing prices.',
      tax_rate: 'Applied at checkout when "prices include VAT" is off.',
      products_per_page: 'Controls the product grid size on the shop and category pages.',
    },
    options: {
      store_currency: [
        { value: 'BDT', label: 'BDT — Bangladeshi Taka (৳)' },
        { value: 'USD', label: 'USD — US Dollar' },
        { value: 'INR', label: 'INR — Indian Rupee' },
      ],
      store_language: [
        { value: 'en', label: 'English' },
        { value: 'bn', label: 'বাংলা (Bangla)' },
      ],
    },
  },
  appearance: {
    title: 'Appearance',
    description:
      'The accent colour used across buttons, links and badges, plus the announcement bar and floating widgets. Changes go live immediately after saving.',
    hints: {
      theme_primary:
        'Pick a preset or fine-tune hue, saturation and lightness. The preview below uses the exact same colour maths as the live storefront, so the swatches you see are the swatches customers get. Aim for a mid-to-dark tone — white button text needs roughly 3:1 contrast.',
      theme_accent:
        'Used for sale flags, wishlist hearts and notification badges. A warm colour against a cool primary reads best.',
      announcement_text: 'Supports Bangla. Keep it under 120 characters so it fits on one line.',
      show_whatsapp_float: 'Turn off if you would rather handle enquiries by phone only.',
    },
    colors: ['theme_primary', 'theme_accent'],
  },
  seo: {
    title: 'SEO Settings',
    description: 'Meta defaults, title templates, verification and structured data.',
    columns: 2,
    hints: {
      seo_title_template: 'Use %s as a placeholder for the page title.',
      seo_robots_txt: 'Served at /robots.txt. Make sure the Sitemap line points to your live domain.',
      seo_verification: 'Paste only the content value from the Google meta tag.',
      seo_schema_org: 'Outputs Product, Organization and BreadcrumbList JSON-LD.',
    },
    rows: { seo_default_description: 3, seo_keywords: 3, seo_robots_txt: 8 },
  },
  checkout: {
    title: 'Checkout Settings',
    description: 'Guest checkout, order limits and required fields.',
    hints: {
      checkout_min_order: 'Set to 0 to disable the minimum.',
      checkout_terms_url: 'Customers must accept these terms before placing an order.',
    },
  },
  shipping: {
    title: 'Shipping Settings',
    description: 'Default rates applied when no shipping zone matches the customer&rsquo;s district.',
    hints: {
      shipping_free_over: 'Orders above this value ship free, regardless of zone.',
      shipping_cod_enabled: 'Turn off if you do not accept cash on delivery.',
    },
  },
  payment: {
    title: 'Payment Settings',
    description: 'Global switches for each payment method. Per-gateway credentials live under Payment Methods.',
    hints: {
      payment_cod_fee: 'Added to the order total when the customer chooses cash on delivery.',
    },
  },
  email: {
    title: 'Email Settings',
    description: 'Transactional email sender identity and notification triggers.',
    hints: {
      email_from_address: 'Use a domain you control to avoid spam filtering.',
    },
    rows: { email_footer_text: 3 },
  },
  sms: {
    title: 'SMS Settings',
    description: 'Bangladeshi SMS gateway configuration for order notifications.',
    hints: {
      sms_sender_id: 'Must be an alphanumeric sender ID approved by your gateway (max 11 characters).',
    },
  },
  social: {
    title: 'Social Media',
    description: 'Links shown in the footer and used for sameAs structured data.',
    hints: {
      social_facebook: 'Full URL including https://',
    },
  },
  analytics: {
    title: 'Analytics Codes',
    description: 'Google Analytics, Tag Manager and Meta Pixel tracking IDs.',
    hints: {
      analytics_ga_id: 'Format: G-XXXXXXXXXX',
      analytics_gtm_id: 'Format: GTM-XXXXXX',
      analytics_fb_pixel: 'Numeric pixel ID only.',
      analytics_enabled: 'Scripts are not injected until this is on, so you can stage a launch safely.',
    },
  },
  advanced: {
    title: 'Advanced',
    description: 'REST API access, caching and debug toggles.',
    hints: {
      advanced_api_key: 'Sent as the x-api-key header. Rotate this before going to production.',
      advanced_debug: 'Shows stack traces in error responses. Never enable in production.',
    },
  },
};

export async function renderSettingsGroup(group: string) {
  const meta = SETTINGS_META[group];
  if (!meta) notFound();

  const rows = await getSettingsGroup(group);
  if (!rows.length) notFound();

  const fields = rows.map((r) => ({
    key: r.key,
    value: r.value,
    type: r.type,
    label: r.label,
    hint: meta.hints?.[r.key],
    options: meta.options?.[r.key],
    placeholder: meta.placeholders?.[r.key],
    rows: meta.rows?.[r.key],
    image: meta.images?.[r.key],
    // Explicit list wins; otherwise any `*_color` / `*_hex` key qualifies. The
    // stored type must still be text, otherwise a boolean like
    // `maintenance_mode` would be mistaken for a colour if it were ever renamed.
    color:
      r.type === 'text' &&
      !meta.images?.[r.key] &&
      (meta.colors?.includes(r.key) ?? COLOR_KEY.test(r.key)),
  }));

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{meta.title}</h1>
        <p className="mt-1 max-w-3xl text-[15px] text-ink-500">{meta.description}</p>
      </header>

      <SettingsForm
        group={group}
        title={meta.title}
        description={meta.description}
        columns={meta.columns ?? 2}
        fields={fields}
      />
    </div>
  );
}
