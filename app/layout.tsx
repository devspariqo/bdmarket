import type { Metadata, Viewport } from 'next';
import { Inter, Hind_Siliguri, Playfair_Display } from 'next/font/google';
import { getSiteConfig } from '@/lib/settings';
import { cssVars } from '@/lib/theme';
import { mimeForIcon } from '@/lib/icons';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bangla',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    // Pages supply a bare name here and get " | BD Market" appended. Pages whose
    // stored SEO title is already complete opt out via pageTitle() in lib/utils.
    default: 'BD Market — Bangladesh Fashion & Lifestyle Online Store',
    template: '%s | BD Market',
  },
  description:
    'Shop authentic Bangladeshi fashion — panjabi, saree, kurti, salwar kameez and lifestyle products. Cash on delivery nationwide, bKash & Nagad accepted. Free shipping over ৳2,000.',
  keywords: [
    'bangladesh online shop', 'bd market', 'panjabi', 'saree', 'kurti',
    'salwar kameez', 'dhaka fashion', 'online shopping bangladesh',
    'cash on delivery bangladesh', 'bkash payment', 'nagad payment',
  ],
  authors: [{ name: 'BD Market' }],
  creator: 'BD Market',
  publisher: 'BD Market',
  applicationName: 'BD Market',
  formatDetection: { telephone: true, address: false, email: false },
  appleWebApp: {
    capable: true,
    title: 'BD Market',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    alternateLocale: ['bn_BD'],
    siteName: 'BD Market',
    title: 'BD Market — Bangladesh Fashion & Lifestyle Online Store',
    description:
      'Authentic Bangladeshi fashion delivered nationwide. Panjabi, saree, kurti & more. COD available.',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BD Market — Bangladesh Fashion & Lifestyle',
    description: 'Authentic Bangladeshi fashion delivered nationwide with Cash on Delivery.',
    creator: '@bdmarket',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: { 'en-BD': '/', 'bn-BD': '/' },
  },
  manifest: '/manifest.webmanifest',
};

// NOTE: `themeColor` is deliberately NOT set here. This export is statically
// evaluated at build time and cannot read settings, and Next renders it before
// the dynamic <head> of RootLayout. Browsers honour only the FIRST
// <meta name="theme-color"> in the document, so a hardcoded value here would
// shadow the merchant's saved colour. The live value is emitted in RootLayout
// below instead.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The accent colour from Settings → Appearance becomes CSS custom properties
  // on <html>. Tailwind's `brand-*` / `ink-900` tokens resolve to these, so a
  // merchant changing the colour recolours the whole site without a rebuild.
  // This has to live in the root layout because the variables must be present
  // on <html> before any component paints.
  const config = await getSiteConfig();

  // The admin can upload a PNG/WebP/SVG, so the declared MIME type has to follow
  // the actual file. Previously this was hardcoded to image/svg+xml, which made
  // browsers reject an uploaded PNG icon. NOTE: `app/icon.svg` used to live here
  // as Next's file-based metadata convention — it is deliberately removed,
  // because Next emits that tag *after* this one (plus a content hash) and
  // browsers pick the last icon, so it silently overrode the merchant's upload.
  const iconHref = config.favicon || '/favicon.svg';
  const iconType = mimeForIcon(iconHref);

  return (
    <html
      lang="en"
      style={
        cssVars(config.appearance.primaryColor, config.appearance.accentColor) as React.CSSProperties
      }
      className={`${inter.variable} ${hind.variable} ${playfair.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href={iconHref} type={iconType} sizes="any" />
        <link rel="apple-touch-icon" href={iconHref} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content={config.appearance.primaryColor || '#006a4e'} />
      </head>
      <body>{children}</body>
    </html>
  );
}
