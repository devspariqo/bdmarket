import type { Metadata } from 'next';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import MobileBottomNav from '@/components/store/MobileBottomNav';
import WhatsAppFloat from '@/components/store/WhatsAppFloat';
import { getSiteConfig, getPaymentLogos } from '@/lib/settings';
import { getCartCount } from '@/lib/cart';
import { getCustomerSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { parseJSON } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: { default: config.seo.defaultTitle, template: config.seo.titleTemplate },
    description: config.seo.defaultDesc,
    keywords: config.seo.keywords.split(',').map((k) => k.trim()),
    openGraph: {
      siteName: config.siteName,
      locale: 'en_BD',
      type: 'website',
      images: config.seo.ogImage ? [config.seo.ogImage] : undefined,
    },
    twitter: { card: 'summary_large_image', site: config.seo.twitterHandle },
    verification: config.seo.verification ? { google: config.seo.verification } : undefined,
  };
}

/**
 * Read a navigation menu, tolerating an unavailable database.
 *
 * This layout wraps every storefront page, including ones Next prerenders at
 * build time, so a throw here would fail the build on a host where the database
 * is not reachable yet. A missing menu simply renders an empty nav.
 */
async function safeMenu(location: string) {
  try {
    const menu = await prisma.menu.findUnique({ where: { location } });
    return parseJSON<any[]>(menu?.items, []);
  } catch (err) {
    console.warn(
      `[menu] could not read "${location}" menu:`,
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [config, cartCount, customer, nav, paymentLogos, footer1, footer2, footer3] =
    await Promise.all([
      getSiteConfig(),
      getCartCount(),
      getCustomerSession(),
      safeMenu('header'),
      getPaymentLogos(),
      safeMenu('footer-1'),
      safeMenu('footer-2'),
      safeMenu('footer-3'),
    ]);

  // JSON-LD Organization + WebSite
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${config.siteUrl}/#organization`,
        name: config.siteName,
        url: config.siteUrl,
        logo: config.logo || `${config.siteUrl}/favicon.svg`,
        description: config.seo.defaultDesc,
        address: {
          '@type': 'PostalAddress',
          streetAddress: config.address,
          addressLocality: 'Dhaka',
          addressCountry: 'BD',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: config.phone,
          contactType: 'customer service',
          areaServed: 'BD',
          availableLanguage: ['en', 'bn'],
        },
        sameAs: Object.values(config.social).filter(Boolean),
      },
      {
        '@type': 'WebSite',
        '@id': `${config.siteUrl}/#website`,
        url: config.siteUrl,
        name: config.siteName,
        inLanguage: 'en-BD',
        publisher: { '@id': `${config.siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${config.siteUrl}/search?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col">
        <Header nav={nav} config={config} cartCount={cartCount} customer={customer} />
        <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        <Footer
          config={config}
          paymentLogos={paymentLogos}
          footerMenus={{
            'footer-1': footer1,
            'footer-2': footer2,
            'footer-3': footer3,
          }}
        />
        <MobileBottomNav cartCount={cartCount} customer={customer} />
        <WhatsAppFloat phone={config.whatsapp} siteName={config.siteName} />
      </div>
    </>
  );
}
