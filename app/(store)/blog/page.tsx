import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { formatDate } from '@/lib/utils';

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: 'Blog — Fashion, Culture & Style Guides',
    description: `Read the latest on Bangladeshi fashion, textile heritage, styling tips and shopping guides from ${config.siteName}.`,
    alternates: { canonical: '/blog' },
  };
}

export default async function BlogPage({
  searchParams,
}: { searchParams: { category?: string; page?: string } }) {
  const config = await getSiteConfig();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = 9;

  const where: any = { status: 'published' };
  if (searchParams.category) where.category = searchParams.category;

  const [posts, total, categories, featured] = await Promise.all([
    prisma.post.findMany({
      where, orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * perPage, take: perPage,
    }),
    prisma.post.count({ where }),
    prisma.post.findMany({ where: { status: 'published' }, select: { category: true }, distinct: ['category'] }),
    prisma.post.findFirst({ where: { status: 'published', featured: true }, orderBy: { publishedAt: 'desc' } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const cats = categories.map((c) => c.category).filter(Boolean) as string[];

  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${config.siteName} Blog`,
    url: `${config.siteUrl}/blog`,
    description: 'Bangladeshi fashion, culture and style guides.',
    blogPost: posts.slice(0, 5).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${config.siteUrl}/blog/${p.slug}`,
      datePublished: new Date(p.publishedAt).toISOString(),
      author: { '@type': 'Person', name: p.authorName },
      image: p.coverImage,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }} />

      <div className="container-x py-10">
        <nav className="mb-3 text-[13px] text-ink-500">
          <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
          <span className="font-semibold text-ink-800">Blog</span>
        </nav>
        <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">The BD Market Journal</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-500">
          Stories on Bangladeshi textile heritage, styling guides and smart shopping tips.
        </p>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/blog" className={`chip ${!searchParams.category ? 'chip-active' : ''}`}>All</Link>
          {cats.map((c) => (
            <Link key={c} href={`/blog?category=${encodeURIComponent(c)}`} className={`chip ${searchParams.category === c ? 'chip-active' : ''}`}>
              {c}
            </Link>
          ))}
        </div>

        {/* Featured */}
        {featured && page === 1 && !searchParams.category && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-8 grid gap-0 overflow-hidden rounded-3xl border border-ink-200 bg-white transition hover:shadow-card lg:grid-cols-2"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-ink-100 lg:aspect-auto">
              {featured.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.coverImage} alt={featured.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              )}
              <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-accent-on">
                Featured
              </span>
            </div>
            <div className="flex flex-col justify-center p-7 lg:p-10">
              <span className="eyebrow">{featured.category}</span>
              <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-ink-900 group-hover:text-brand-700 lg:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink-600">{featured.excerpt}</p>
              <div className="mt-5 flex items-center gap-4 text-[12px] text-ink-400">
                <span>{formatDate(featured.publishedAt, 'long')}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readMinutes} min</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {featured.viewCount.toLocaleString()}</span>
              </div>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-bold text-brand-700 transition group-hover:gap-3">
                Read article <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        )}

        {/* Grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-ink-100">
                {p.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                )}
                {p.category && (
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-ink-800 backdrop-blur">
                    {p.category}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-700">
                  {p.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-ink-500">{p.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 border-t border-ink-100 pt-3 text-[12px] text-ink-400">
                  <span>{formatDate(p.publishedAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readMinutes} min</span>
                  <span className="ml-auto inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {p.viewCount.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="mt-9 flex items-center justify-center gap-2">
            {page > 1 && <Link href={`/blog?page=${page - 1}`} className="btn-outline btn-sm">← Prev</Link>}
            <span className="px-3 text-[13px] font-semibold text-ink-600">Page {page} of {totalPages}</span>
            {page < totalPages && <Link href={`/blog?page=${page + 1}`} className="btn-outline btn-sm">Next →</Link>}
          </nav>
        )}
      </div>
    </>
  );
}
