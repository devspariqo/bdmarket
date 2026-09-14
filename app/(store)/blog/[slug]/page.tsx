import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Eye, Calendar, ArrowLeft, Tag } from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { formatDate, pageTitle } from '@/lib/utils';

export const revalidate = 120;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post) return { title: 'Article Not Found' };
  const config = await getSiteConfig();
  return {
    title: pageTitle(post.metaTitle, post.title),
    description: post.metaDesc || post.excerpt || config.seo.defaultDesc,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt || '',
      url: `/blog/${post.slug}`,
      images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : undefined,
      publishedTime: new Date(post.publishedAt).toISOString(),
      authors: [post.authorName],
    },
    twitter: { card: 'summary_large_image', title: post.title, images: post.coverImage ? [post.coverImage] : undefined },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const config = await getSiteConfig();

  const post = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!post || post.status !== 'published') notFound();

  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const related = await prisma.post.findMany({
    where: { status: 'published', id: { not: post.id }, ...(post.category ? { category: post.category } : {}) },
    take: 3, orderBy: { publishedAt: 'desc' },
  });

  const tags = (post.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    author: { '@type': 'Person', name: post.authorName },
    publisher: {
      '@type': 'Organization',
      name: config.siteName,
      logo: { '@type': 'ImageObject', url: config.logo || `${config.siteUrl}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${config.siteUrl}/blog/${post.slug}` },
    keywords: tags.join(', '),
    articleSection: post.category,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <article>
        {/* Cover */}
        {post.coverImage && (
          <div className="relative h-[280px] overflow-hidden bg-ink-900 sm:h-[380px] lg:h-[440px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover opacity-70" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/20" />
            <div className="container-x absolute inset-x-0 bottom-0 pb-8">
              {post.category && (
                <span className="mb-3 inline-block rounded-full bg-brand-600 px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-white">
                  {post.category}
                </span>
              )}
              <h1 className="max-w-3xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-[42px]">
                {post.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-300">
                <span className="font-semibold text-white">{post.authorName}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt, 'long')}</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {post.readMinutes} min read</span>
                <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {post.viewCount.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        )}

        <div className="container-x py-10">
          <div className="mx-auto max-w-3xl">
            {!post.coverImage && (
              <>
                <h1 className="font-display text-3xl font-bold text-ink-900">{post.title}</h1>
                <div className="mt-3 flex items-center gap-4 text-[13px] text-ink-500">
                  <span className="font-semibold text-ink-800">{post.authorName}</span>
                  <span>{formatDate(post.publishedAt, 'long')}</span>
                </div>
              </>
            )}

            <Link href="/blog" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to all articles
            </Link>

            {post.excerpt && (
              <p className="mb-7 border-l-4 border-brand-500 bg-brand-50/50 py-3 pl-5 text-base font-medium leading-relaxed text-ink-700">
                {post.excerpt}
              </p>
            )}

            <div
              className="prose-article space-y-4 text-[15px] leading-[1.85] text-ink-700"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {tags.length > 0 && (
              <div className="mt-9 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-6">
                <Tag className="h-3.5 w-3.5 text-ink-400" />
                {tags.map((t) => (
                  <span key={t} className="rounded-full bg-ink-100 px-3 py-1 text-[12px] font-semibold text-ink-600">#{t}</span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 rounded-3xl bg-gradient-to-br from-brand-600 to-ink-900 p-7 text-center">
              <h2 className="font-display text-xl font-bold text-white">Ready to shop authentic Bangladeshi fashion?</h2>
              <p className="mt-2 text-[15px] text-ink-200">Free delivery over ৳{config.freeShippingOver} · Cash on delivery nationwide</p>
              <Link href="/shop" className="btn-lg mt-5 bg-white font-bold text-ink-900 hover:bg-ink-100">
                Browse the Shop
              </Link>
            </div>
          </div>

          {related.length > 0 && (
            <section className="mx-auto mt-14 max-w-5xl border-t border-ink-200 pt-10">
              <h2 className="mb-6 font-display text-2xl font-bold text-ink-900">Related Articles</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="group">
                    <div className="aspect-[16/10] overflow-hidden rounded-xl bg-ink-100">
                      {r.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverImage} alt={r.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                      )}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink-900 group-hover:text-brand-700">{r.title}</h3>
                    <p className="mt-1 text-[12px] text-ink-400">{formatDate(r.publishedAt)} · {r.readMinutes} min</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}
