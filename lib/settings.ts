import prisma from './db';
import { parsePaymentLogos, type PaymentLogo } from './payment-logos';
import { parseCheckoutFields, type CheckoutField } from './checkout-fields';

// ─── Settings access with in-request cache ───

let cache: Map<string, string> | null = null;
let cacheTime = 0;
const TTL = 5000;

/**
 * The query currently in flight, if any.
 *
 * Without this, concurrent callers all miss the cache — none of them has
 * populated it yet — and each runs its own `SELECT * FROM Setting`. A single
 * product page render calls `getSiteConfig()`, `getPaymentLogos()` and several
 * `getSetting()` in parallel, which measured **ten identical queries per page
 * load**. Sharing the promise collapses that to one, and the result still lands
 * in `cache` for the rest of the TTL.
 */
let inflight: Promise<Record<string, string>> | null = null;

/**
 * Read every setting as a flat key/value map.
 *
 * Deliberately fails soft. This is called from `RootLayout`, so it runs for
 * *every* page — including ones Next prerenders at build time. On a fresh
 * deployment there may be no database yet (an unseeded SQLite file, or a
 * Postgres instance that is not reachable during the build), and a throw here
 * would fail the entire build rather than one request.
 *
 * Every consumer already supplies its own defaults (`getSiteConfig()` below
 * falls back to sensible values, `getPaymentLogos()` to the built-in nine), so
 * returning an empty map degrades to "default theme, default copy" instead of
 * a broken deploy.
 *
 * Failures are intentionally NOT cached, so the next request retries once the
 * database becomes available.
 */
export async function getAllSettings(force = false): Promise<Record<string, string>> {
  if (!force && cache && Date.now() - cacheTime < TTL) return Object.fromEntries(cache);
  // A forced refresh must not join an in-flight request that may predate the
  // change being forced for.
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const rows = await prisma.setting.findMany();
      cache = new Map(rows.map((r) => [r.key, r.value]));
      cacheTime = Date.now();
      return Object.fromEntries(cache);
    } catch (err) {
      console.warn(
        '[settings] database unavailable, falling back to defaults:',
        err instanceof Error ? err.message : err
      );
      return {};
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function getSetting(key: string, fallback = ''): Promise<string> {
  const all = await getAllSettings();
  return all[key] ?? fallback;
}

export async function getSettingsGroup(group: string) {
  return prisma.setting.findMany({ where: { group }, orderBy: { key: 'asc' } });
}

/**
 * Accepted-payment brand logos, for the footer grid.
 *
 * Kept out of `getSiteConfig` because the footer is the only consumer and the
 * value is a JSON blob — parsing it on every page would be wasted work.
 */
export async function getPaymentLogos(): Promise<PaymentLogo[]> {
  const all = await getAllSettings();
  return parsePaymentLogos(all['payment_logos']);
}

/**
 * Which fields the checkout form asks for, and which are required.
 *
 * Falls back to the built-in defaults when nothing has been saved, so a store
 * that has never opened the settings page still has a working checkout.
 */
export async function getCheckoutFields(): Promise<CheckoutField[]> {
  const all = await getAllSettings();
  return parseCheckoutFields(all['checkout_fields']);
}

export async function setSetting(key: string, value: string, group?: string, type?: string, label?: string) {
  cache = null;
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value, group: group ?? 'general', type: type ?? 'text', label },
  });
}

export async function setSettings(entries: { key: string; value: string; group?: string; type?: string; label?: string }[]) {
  cache = null;
  await prisma.$transaction(
    entries.map((e) =>
      prisma.setting.upsert({
        where: { key: e.key },
        update: { value: e.value },
        create: { key: e.key, value: e.value, group: e.group ?? 'general', type: e.type ?? 'text', label: e.label },
      })
    )
  );
  return true;
}

export function invalidateSettingsCache() {
  cache = null;
}

// ─── Typed getters ───

export async function getSiteConfig() {
  const s = await getAllSettings();
  return {
    siteName: s.site_name || 'BD Market',
    siteNameBn: s.site_name_bn || 'বিডি মার্কেট',
    tagline: s.site_tagline || 'Bangladesh\'s Fashion & Lifestyle Store',
    logo: s.site_logo || '',
    /**
     * The footer sits on `bg-ink-900`, so the header logo — usually dark ink on
     * white — can disappear against it. `footer_logo` is an optional dark-theme
     * variant; when it is not set we fall back to the main logo so a single-logo
     * store keeps working unchanged.
     */
    footerLogo: s.footer_logo || s.site_logo || '',
    favicon: s.site_favicon || '',
    siteUrl: s.site_url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    email: s.store_email || 'support@bdmarket.com.bd',
    phone: s.store_phone || '+880 1700-000000',
    whatsapp: s.store_whatsapp || '+8801700000000',
    address: s.store_address || 'House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh',
    currency: s.store_currency || 'BDT',
    currencySymbol: s.store_currency_symbol || '৳',
    country: s.store_country || 'Bangladesh',
    timezone: s.store_timezone || 'Asia/Dhaka',
    language: s.store_language || 'en',
    defaultLang: s.default_language || 'en',
    enableBn: s.enable_bangla === 'true',
    codEnabled: s.payment_cod_enabled !== 'false',
    freeShippingOver: Number(s.shipping_free_over || 2000),
    taxRate: Number(s.tax_rate || 0),
    taxInclusive: s.tax_inclusive !== 'false',
    lowStock: Number(s.low_stock_threshold || 5),
    maintenance: s.maintenance_mode === 'true',
    reviewsAutoApprove: s.reviews_auto_approve === 'true',
    guestCheckout: s.checkout_guest !== 'false',
    /**
     * Send the shopper straight to checkout after adding to cart.
     *
     * Right for a single-product funnel, wrong for a catalogue — browsing a shop
     * and being thrown into checkout on every card is hostile. Off by default,
     * and read through `CartBehaviourProvider` so a button deep in the tree does
     * not need it threaded through as a prop.
     */
    cartRedirectCheckout: s.cart_redirect_checkout === 'true',
    social: {
      facebook: s.social_facebook || 'https://facebook.com',
      instagram: s.social_instagram || 'https://instagram.com',
      youtube: s.social_youtube || '',
      tiktok: s.social_tiktok || '',
      twitter: s.social_twitter || '',
      linkedin: s.social_linkedin || '',
    },
    seo: {
      defaultTitle: s.seo_default_title || 'BD Market — Bangladesh Fashion & Lifestyle Online Store',
      titleTemplate: s.seo_title_template || '%s | BD Market',
      defaultDesc: s.seo_default_description || 'Shop authentic Bangladeshi fashion, panjabi, saree, kurti and lifestyle products. Cash on delivery nationwide, bKash & Nagad accepted.',
      keywords: s.seo_keywords || 'bangladesh online shop, panjabi, saree, kurti, bd market, dhaka fashion',
      ogImage: s.seo_og_image || '',
      twitterHandle: s.seo_twitter_handle || '@bdmarket',
      gaId: s.analytics_ga_id || '',
      gtmId: s.analytics_gtm_id || '',
      fbPixel: s.analytics_fb_pixel || '',
      verification: s.seo_verification || '',
    },
    appearance: {
      primaryColor: s.theme_primary || '#006a4e',
      accentColor: s.theme_accent || '#f42a41',
      productsPerPage: Number(s.products_per_page || 12),
      showAnnouncement: s.show_announcement !== 'false',
      /**
       * Read here rather than in the layout so both floating widgets follow the
       * same rule as the announcement bar. `show_whatsapp_float` was saved by the
       * admin but never read anywhere, so turning it off did nothing.
       */
      showWhatsappFloat: s.show_whatsapp_float !== 'false',
      announcementText: s.announcement_text || 'ফ্রি ডেলিভারি ৳২০০০+ অর্ডারে • সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
    },
    /**
     * Homepage hero copy.
     *
     * Only the headline and the three figures live here — the banner image, badge
     * and buttons still come from the Banner table. Keeping the wording in
     * settings means it is editable without adding columns to Banner, so it works
     * on an existing database with no migration.
     *
     * `??` rather than `||` on the figures: an absent key falls back to the
     * default, while an explicitly emptied one stays empty and hides the stat.
     */
    homepage: {
      heroHeading: s.hero_heading || 'Authentic Bangladeshi Fashion, Delivered Nationwide',
      heroStats: [
        { value: s.hero_stat_1_value ?? '64', label: s.hero_stat_1_label ?? 'Districts Delivered' },
        { value: s.hero_stat_2_value ?? '24K+', label: s.hero_stat_2_label ?? 'Happy Customers' },
        { value: s.hero_stat_3_value ?? '4.8★', label: s.hero_stat_3_label ?? 'Average Rating' },
      ].filter((x) => x.value.trim() !== ''),
    },
  };
}

export type SiteConfig = Awaited<ReturnType<typeof getSiteConfig>>;
