import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { pageTitle } from '@/lib/utils';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page) return { title: 'Page Not Found' };
  return {
    title: pageTitle(page.metaTitle, page.title),
    description: page.metaDesc || `${page.title} — ${page.excerpt || ''}`.slice(0, 160),
    alternates: { canonical: `/pages/${page.slug}` },
    openGraph: { title: page.title, type: 'article' },
  };
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page || page.status !== 'published') notFound();

  const config = await getSiteConfig();

  // Special handling: order tracking page has a form
  const isTrack = page.slug === 'track-order';

  return (
    <div className="container-x py-10">
      <nav className="mb-5 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
        <span className="font-semibold text-ink-800">{page.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{page.title}</h1>
        {page.titleBn && <p className="bn mt-2 text-base text-ink-500">{page.titleBn}</p>}
        <div className="mt-2 h-1 w-14 rounded-full bg-brand-600" />

        <div
          className="prose-page mt-8 space-y-4 text-[15px] leading-[1.85] text-ink-700"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />

        {isTrack && <TrackForm />}

        <div className="mt-12 rounded-2xl border border-ink-200 bg-ink-50/60 p-6">
          <h2 className="text-[15px] font-bold text-ink-900">Still need help?</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
            Call our hotline <a href={`tel:${config.phone}`} className="font-semibold text-brand-700">{config.phone}</a> (9 AM – 9 PM daily)
            or email <a href={`mailto:${config.email}`} className="font-semibold text-brand-700">{config.email}</a>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/pages/contact" className="btn-dark btn-sm">Contact Us</Link>
            <Link href="/pages/faq" className="btn-outline btn-sm">Read FAQ</Link>
            <Link href="/pages/returns" className="btn-outline btn-sm">Return Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import TrackForm from '@/components/store/TrackForm';
