import { notFound } from 'next/navigation';
import { getSettingsGroup } from '@/lib/settings';
import { getAdminBase } from '@/lib/admin-path';
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
  /**
   * Keys this group declares that may not exist as a `Setting` row yet, with the
   * values a fresh install would have.
   *
   * A group's fields are driven by rows in the database, so a key added to this
   * file after an install was seeded would otherwise be invisible until someone
   * re-seeded — which would wipe their configuration. Declaring it here makes the
   * field render immediately, and the first save creates the row. See
   * `renderSettingsGroup` below.
   */
  defaults?: Record<string, { value?: string; type?: string; label?: string }>;
};

/** Keys that should always be treated as colours, regardless of group. */
const COLOR_KEY = /(^|_)(color|colour|hex)(_|$)/i;

/** `footer_logo` → `Footer Logo`, for keys that have no Setting row yet. */
function humaniseKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const SETTINGS_META: Record<string, Meta> = {
  general: {
    title: 'General Settings',
    description: 'Core store identity — name, tagline, contact details and maintenance mode.',
    hints: {
      site_url: 'Used for canonical URLs, sitemap and structured data. Update this before going live.',
      site_logo:
        'Shown in the website header, the footer and the admin sidebar. When set, it replaces the site name text. A transparent PNG, WebP or SVG works best; wide logos display around 190px.',
      site_favicon:
        'The little icon in the browser tab and on the phone home screen. Upload a square PNG or SVG at least 256×256 — it appears immediately after saving, no rebuild needed. Leave empty to use the built-in BD Market icon.',
      footer_logo:
        'The logo for the site footer, which sits on a near-black background. Upload a light-on-dark or transparent version of your logo here — the header logo is usually dark ink on white and can vanish against the footer. Leave empty to reuse the main logo.',
      store_whatsapp: 'Include the country code, e.g. +8801700000000. Used for the floating chat button.',
      maintenance_mode: 'When on, the website shows a maintenance notice. Admin stays accessible.',
    },
    images: {
      // The header renders the logo at <=190px and the footer at <=180px, so 3x for
      // retina is ~600px. Anything wider is pure page weight.
      site_logo: { maxWidth: 600, previewClassName: 'h-20' },
      // Square by nature — 256 covers the 180px apple-touch and 512 manifest sizes.
      site_favicon: { maxWidth: 512, accept: 'image/png,image/webp,image/jpeg,image/svg+xml,.svg,image/*', previewClassName: 'h-20' },
      // Matches site_logo: the footer renders it at <=180px.
      footer_logo: { maxWidth: 600, previewClassName: 'h-20' },
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
        'Pick a preset or fine-tune hue, saturation and lightness. The preview below uses the exact same colour maths as the live website, so the swatches you see are the swatches customers get. Aim for a mid-to-dark tone — white button text needs roughly 3:1 contrast.',
      theme_accent:
        'Used for sale flags, wishlist hearts and notification badges. A warm colour against a cool primary reads best.',
      announcement_text: 'Supports Bangla. Keep it under 120 characters so it fits on one line.',
      show_whatsapp_float: 'Turn off if you would rather handle enquiries by phone only.',
    },
    colors: ['theme_primary', 'theme_accent'],
  },
  homepage: {
    title: 'Homepage',
    description:
      'The headline and the three figures shown over the main hero banner. The banner image, badge and buttons come from Banners — this group only controls the text laid over it.',
    hints: {
      hero_heading:
        'The large headline on the main hero. Keep it under about 60 characters so it stays on two lines on a phone.',
      hero_stat_1_value: 'The figure itself, e.g. 64, 24K+ or 4.8★. Leave the value empty to hide this stat.',
      hero_stat_1_label: 'The caption under the figure, e.g. Districts Delivered.',
      hero_stat_2_value: 'The figure itself. Leave the value empty to hide this stat.',
      hero_stat_2_label: 'The caption under the figure.',
      hero_stat_3_value: 'The figure itself. Leave the value empty to hide this stat.',
      hero_stat_3_label: 'The caption under the figure.',
    },
    defaults: {
      hero_heading: {
        value: 'Authentic Bangladeshi Fashion, Delivered Nationwide',
        type: 'text',
        label: 'Hero Headline',
      },
      hero_stat_1_value: { value: '64', type: 'text', label: 'Stat 1 — Figure' },
      hero_stat_1_label: { value: 'Districts Delivered', type: 'text', label: 'Stat 1 — Caption' },
      hero_stat_2_value: { value: '24K+', type: 'text', label: 'Stat 2 — Figure' },
      hero_stat_2_label: { value: 'Happy Customers', type: 'text', label: 'Stat 2 — Caption' },
      hero_stat_3_value: { value: '4.8★', type: 'text', label: 'Stat 3 — Figure' },
      hero_stat_3_label: { value: 'Average Rating', type: 'text', label: 'Stat 3 — Caption' },
    },
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
      cart_redirect_checkout:
        'On: adding to cart goes straight to the checkout page — good for a single-product funnel. Off: the shopper stays where they are and the cart count updates, which is what a browsing shopper expects.',
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
    title: 'Email & SMTP',
    description:
      'The outgoing mail server and the transactional emails sent to customers. Credentials are stored in the database, so the mail server can be changed without a redeploy.',
    hints: {
      email_enabled:
        'Master switch for every transactional email. Turn it off while testing so real customers are not emailed.',
      smtp_host: 'The outgoing mail server, e.g. smtp.gmail.com or smtp.hostinger.com.',
      smtp_port: '587 for STARTTLS (the usual choice), 465 for implicit SSL, 25 only for an internal relay.',
      smtp_encryption: 'Match this to the port — STARTTLS on 587, SSL/TLS on 465, None only on a trusted internal relay.',
      smtp_username: 'Usually the full mailbox address, e.g. orders@bdmarket.com.bd.',
      smtp_password:
        'Use an app password rather than the mailbox login where the provider offers them. It is stored in the database, so rotate it if the database is ever shared.',
      email_from_name: 'The sender name customers see, e.g. "BD Market Orders".',
      email_from_address:
        'Use a domain you control, and one your SMTP server is allowed to send as, or mail lands in spam.',
      email_order_confirm: 'Sent as soon as an order is placed.',
      email_order_shipped: 'Sent when an order is marked shipped, including the tracking number if one is set.',
      email_footer_text: 'Appended to the bottom of every email. Keep it to the essentials.',
      email_notify_customer: 'The order confirmation the buyer receives.',
      email_notify_admin:
        'Goes to the Support Email set under Settings → General. Leave this on so orders still reach you if the customer mistyped their address.',
    },
    defaults: {
      email_enabled: { value: 'true', type: 'boolean', label: 'Enable Transactional Email' },
      smtp_host: { value: '', type: 'text', label: 'SMTP Host' },
      smtp_port: { value: '587', type: 'number', label: 'SMTP Port' },
      smtp_encryption: { value: 'tls', type: 'select', label: 'Encryption' },
      smtp_username: { value: '', type: 'text', label: 'SMTP Username' },
      smtp_password: { value: '', type: 'text', label: 'SMTP Password' },
      email_notify_customer: { value: 'true', type: 'boolean', label: 'Email the Customer' },
      email_notify_admin: { value: 'true', type: 'boolean', label: 'Email the Store' },
    },
    options: {
      smtp_encryption: [
        { value: 'tls', label: 'STARTTLS — port 587' },
        { value: 'ssl', label: 'SSL / TLS — port 465' },
        { value: 'none', label: 'None — unencrypted' },
      ],
    },
    rows: { email_footer_text: 3 },
  },
  sms: {
    title: 'SMS Gateway',
    description:
      'The Bangladeshi SMS gateway used for order notifications, and which events send a message. Credentials live in the database rather than the environment.',
    hints: {
      sms_enabled: 'Master switch for all outgoing SMS.',
      sms_provider: 'Pick your gateway. Choose Custom if it is not listed, then fill in the endpoint below.',
      sms_api_key: 'The API key or token your gateway issued. Masked in the admin — use Reveal to check it.',
      sms_api_url: 'Only needed for a Custom gateway. The endpoint messages are POSTed to.',
      sms_sender_id: 'Must be an alphanumeric sender ID approved by your gateway (max 11 characters).',
      sms_order_confirm: 'Sent when an order is placed.',
      sms_order_shipped: 'Sent when an order is handed to the courier.',
      sms_order_delivered: 'Sent when the order is marked delivered.',
      sms_notify_customer: 'The buyer gets a short confirmation on their own number.',
      sms_notify_admin: 'Goes to the Hotline number set under Settings → General, so you hear about orders away from a screen.',
    },
    defaults: {
      sms_provider: { value: 'greenweb', type: 'select', label: 'SMS Gateway' },
      sms_api_key: { value: '', type: 'text', label: 'API Key' },
      sms_api_url: { value: '', type: 'text', label: 'Custom API Endpoint' },
      sms_order_delivered: { value: 'true', type: 'boolean', label: 'SMS on Delivery' },
      sms_notify_customer: { value: 'true', type: 'boolean', label: 'SMS the Customer' },
      sms_notify_admin: { value: 'true', type: 'boolean', label: 'SMS the Store' },
    },
    options: {
      sms_provider: [
        { value: 'greenweb', label: 'Greenweb' },
        { value: 'bulksmsbd', label: 'Bulk SMS BD' },
        { value: 'sslwireless', label: 'SSL Wireless' },
        { value: 'banglanet', label: 'Banglanet' },
        { value: 'custom', label: 'Custom gateway' },
      ],
    },
  },
  courier: {
    title: 'Courier & Delivery',
    description:
      'Courier accounts used to dispatch orders, plus the pickup and return addresses that go on every consignment note. Credentials are stored in the database.',
    hints: {
      courier_default: 'The courier pre-selected when you book a shipment. Manual means you arrange delivery yourself.',
      courier_cod_enabled:
        'Include the collectable cash amount when booking, so the courier collects payment and remits it back to you.',
      courier_pickup_address: 'Where couriers collect parcels from. Printed on the consignment note.',
      courier_return_address: 'Where undelivered parcels come back to.',
      pathao_client_id: 'From Pathao Merchant → Developer API.',
      pathao_client_secret: 'Masked in the admin — use Reveal to check it.',
      pathao_username: 'The email address on your Pathao merchant account.',
      pathao_password: 'Masked in the admin — use Reveal to check it.',
      steadfast_api_key: 'From Steadfast → API settings.',
      steadfast_secret_key: 'Masked in the admin — use Reveal to check it.',
      redx_api_key: 'From RedX → API access.',
      redx_pickup_store_id: 'The RedX pickup store parcels are dispatched from.',
    },
    defaults: {
      courier_default: { value: 'manual', type: 'select', label: 'Default Courier' },
      courier_cod_enabled: { value: 'true', type: 'boolean', label: 'Send COD Amount to Courier' },
      courier_pickup_address: { value: '', type: 'textarea', label: 'Pickup Address' },
      courier_return_address: { value: '', type: 'textarea', label: 'Return Address' },
      pathao_client_id: { value: '', type: 'text', label: 'Pathao Client ID' },
      pathao_client_secret: { value: '', type: 'text', label: 'Pathao Client Secret' },
      pathao_username: { value: '', type: 'text', label: 'Pathao Username' },
      pathao_password: { value: '', type: 'text', label: 'Pathao Password' },
      steadfast_api_key: { value: '', type: 'text', label: 'Steadfast API Key' },
      steadfast_secret_key: { value: '', type: 'text', label: 'Steadfast Secret Key' },
      redx_api_key: { value: '', type: 'text', label: 'RedX API Key' },
      redx_pickup_store_id: { value: '', type: 'text', label: 'RedX Pickup Store ID' },
    },
    options: {
      courier_default: [
        { value: 'manual', label: 'Manual — arrange delivery yourself' },
        { value: 'pathao', label: 'Pathao' },
        { value: 'steadfast', label: 'Steadfast' },
        { value: 'redx', label: 'RedX' },
      ],
    },
    rows: { courier_pickup_address: 3, courier_return_address: 3 },
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
    description: 'REST API access, the admin panel URL, caching and debug toggles.',
    hints: {
      advanced_api_key: 'Sent as the x-api-key header. Rotate this before going to production.',
      advanced_debug: 'Shows stack traces in error responses. Never enable in production.',
      admin_path:
        'The path the admin panel is served on, e.g. "bd-panel" gives /bd-panel. Leave as "admin" for the default. While a custom path is set, /admin returns 404 so scanners cannot find the login form. This is obscurity, not security — it does not stop anyone who knows the path, so keep a strong password. Lowercase letters, digits and hyphens only; reserved words like api, shop and checkout are ignored.',
    },
  },
};

export async function renderSettingsGroup(group: string) {
  const meta = SETTINGS_META[group];
  if (!meta) notFound();

  // Needed by the form so that changing the panel path can send the merchant to
  // the new one — see SettingsForm.save().
  const base = await getAdminBase();

  const rows = await getSettingsGroup(group);

  /**
   * Fields declared in `meta` that have no Setting row yet.
   *
   * A key added to this file after an install was seeded (such as
   * `footer_logo`) exists only in code, so without this the field would be
   * invisible until the database was re-seeded — which is not something we can
   * ask of a live deployment. `SettingsForm` posts every field it renders and
   * the settings API upserts by key, so the first save creates the row.
   *
   * Sorted by key alongside the real rows so a synthetic field sits exactly
   * where it would if it had been seeded.
   *
   * `meta.defaults` covers ordinary text/boolean/select fields, which carry no
   * implicit type the way an uploader or a colour picker does.
   */
  const declared = [
    ...Object.keys(meta.images ?? {}),
    ...(meta.colors ?? []),
    ...Object.keys(meta.defaults ?? {}),
  ];
  const allRows = [
    ...rows,
    ...declared
      .filter((key) => !rows.some((r) => r.key === key))
      .map((key) => {
        const d = meta.defaults?.[key];
        return {
          id: `virtual-${group}-${key}`,
          group,
          key,
          value: d?.value ?? '',
          // Match what a seeded row would look like, so the first save writes the
          // right type rather than a generic 'text'.
          type: meta.images?.[key] ? 'image' : d?.type ?? 'text',
          label: d?.label ?? humaniseKey(key),
          updatedAt: new Date(),
        };
      }),
  ].sort((a, b) => a.key.localeCompare(b.key));

  // Checked after synthesis, not before: a group introduced entirely in code (such
  // as `courier`) has no rows until the merchant saves it for the first time, and
  // 404-ing there would make the page unreachable.
  if (!allRows.length) notFound();

  const fields = allRows.map((r) => ({
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
        base={base}
      />
    </div>
  );
}
