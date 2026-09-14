import type { MetadataRoute } from 'next';
import { getSettingsGroup } from '@/lib/settings';
import { mimeForIcon } from '@/lib/icons';

/**
 * Web App Manifest — served at /manifest.webmanifest
 * Makes the storefront installable and gives mobile devices proper
 * chrome colours, splash behaviour and a home-screen icon.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = 'BD Market';
  let siteNameBn = 'বিডি মার্কেট';
  let tagline = "Bangladesh's Fashion & Lifestyle Store";
  let themeColor = '#006a4e';
  let favicon = '/favicon.svg';

  try {
    const [general, appearance] = await Promise.all([
      getSettingsGroup('general'),
      getSettingsGroup('appearance'),
    ]);
    const pick = (rows: any[], key: string) => rows.find((r) => r.key === key)?.value || '';
    siteName = pick(general, 'site_name') || siteName;
    siteNameBn = pick(general, 'site_name_bn') || siteNameBn;
    tagline = pick(general, 'site_tagline') || tagline;
    themeColor = pick(appearance, 'theme_primary') || themeColor;
    // The admin-uploaded icon drives the installed-app icon too, not just the
    // browser tab. Previously this was hardcoded to /icon.svg, so uploading a
    // favicon left the home-screen icon stale.
    favicon = pick(general, 'site_favicon') || favicon;
  } catch {
    // Settings unavailable (e.g. cold DB) — fall back to safe defaults.
  }

  return {
    name: `${siteName} — ${tagline}`,
    short_name: siteName,
    description: siteNameBn
      ? `${tagline} | ${siteNameBn}`
      : tagline,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: themeColor,
    lang: 'en-BD',
    dir: 'ltr',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: favicon,
        sizes: 'any',
        type: mimeForIcon(favicon),
        purpose: 'any',
      },
      {
        src: favicon,
        sizes: 'any',
        type: mimeForIcon(favicon),
        purpose: 'maskable',
      },
    ],
  };
}
