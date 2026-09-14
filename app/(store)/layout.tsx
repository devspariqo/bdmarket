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

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [config, cartCount, customer, headerMenu, paymentLogos] = await Promise.all([
    getSiteConfig(),
    getCartCount(),
    getCustomerSession(),
    prisma.menu.findUnique({ where: { location: 'header' } }),
    getPaymentLogos(),
  ]);

  const nav = parseJSON<any[]>(headerMenu?.items, []);

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
            'footer-1': parseJSON<any[]>(
              (await prisma.menu.findUnique({ where: { location: 'footer-1' } }))?.items,
              []
            ),
            'footer-2': parseJSON<any[]>(
              (await prisma.menu.findUnique({ where: { location: 'footer-2' } }))?.items,
              []
            ),
            'footer-3': parseJSON<any[]>(
              (await prisma.menu.findUnique({ where: { location: 'footer-3' } }))?.items,
              []
            ),
          }}
        />
        <MobileBottomNav cartCount={cartCount} customer={customer} />
        <WhatsAppFloat phone={config.whatsapp} siteName={config.siteName} />
      </div>
    </>
  );
}
