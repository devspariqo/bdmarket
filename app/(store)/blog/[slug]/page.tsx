import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Eye, Calendar, ArrowLeft, Tag, Flame, FolderOpen } from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { formatDate, pageTitle } from '@/lib/utils';
import { buildToc, readingMinutes } from '@/lib/toc';
import { imageAt, srcSetFor, CARD_WIDTHS } from '@/lib/images';
import PostToc from '@/components/store/PostToc';

/**
 * `revalidate` keeps the cached entry fresh without making every view dynamic.
 * The storefront layout calls `cookies()`, so this route is rendered on demand
 * regardless — the value only bounds how long a cached render may be reused.
 */
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

  /**
   * The sidebar and the related strip, in one round trip.
   *
   * `groupBy` for the categories rather than loading every post and counting in
   * JavaScript — a blog with a few hundred articles would otherwise pull all of
   * them to render one page.
   */
  const [popular, recent, categoryRows, related] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'published', id: { not: post.id } },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: { id: true, slug: true, title: true, coverImage: true, viewCount: true, publishedAt: true, readMinutes: true },
    }),
    prisma.post.findMany({
      where: { status: 'published', id: { not: post.id } },
      orderBy: { publishedAt: 'desc' },
      take: 4,
      select: { id: true, slug: true, title: true, coverImage: true, publishedAt: true, readMinutes: true },
    }),
    prisma.post
      .groupBy({
        by: ['category'],
        where: { status: 'published', category: { not: null } },
        _count: { _all: true },
      })
      .catch(() => []),
    prisma.post.findMany({
      where: { status: 'published', id: { not: post.id }, ...(post.category ? { category: post.category } : {}) },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    }),
  ]);

  const categories = (categoryRows as any[])
    .filter((c) => c.category)
    .map((c) => ({ name: c.category as string, count: c._count?._all ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const tags = (post.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  // Heading ids are injected here so the anchors exist in the server-rendered
  // HTML — a link in the TOC has to work before any JavaScript runs.
  const { html: contentHtml, headings } = buildToc(post.content);
  const minutes = post.readMinutes || readingMinutes(post.content);
  const authorLogo = config.logo || config.favicon;

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
        {/* ── Hero: the cover as a background, with the headline over it ── */}
        <header className="relative overflow-hidden bg-ink-950">
          {post.coverImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageAt(post.coverImage, 1600, 70)}
                srcSet={srcSetFor(post.coverImage, [900, 1400, 1900], 70)}
                sizes="100vw"
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40" />
            </>
          )}

          <div className="container-x relative py-10 sm:py-14">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/70 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All articles
            </Link>

            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              {/* Left: title and the article's details */}
              <div>
                {post.category && (
                  <span className="inline-block rounded-full bg-brand-600 px-3 py-1 text-[12px] font-bold uppercase tracking-wider text-white">
                    {post.category}
                  </span>
                )}

                <h1 className="mt-4 font-display text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-[40px]">
                  {post.title}
                </h1>

                {/* Author identity: the store's mark beside the byline, the way a
                    publication shows its masthead next to the writer's name. */}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-ink-300">
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white/25">
                      {authorLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={authorLogo} alt={config.siteName} className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="text-[14px] font-bold text-brand-700">
                          {config.siteName.charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-white">{post.authorName}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt, 'long')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {minutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> {post.viewCount.toLocaleString()} views
                  </span>
                </div>
              </div>

              {/* Right: the feature image itself, in full. On phones the same
                  image is already the hero background, so it is not repeated. */}
              {post.coverImage && (
                <div className="hidden overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 lg:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageAt(post.coverImage, 900, 75)}
                    srcSet={srcSetFor(post.coverImage, [600, 900, 1200], 75)}
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    alt={post.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Body: article + sidebar ── */}
        <div className="container-x py-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {post.excerpt && (
                <p className="mb-6 border-l-4 border-brand-500 bg-brand-50/50 py-3 pl-5 text-base font-medium leading-relaxed text-ink-700">
                  {post.excerpt}
                </p>
              )}

              {/* Collapsed by default — a long outline would push the opening
                  paragraph off the screen. */}
              <div className="mb-6">
                <PostToc headings={headings} />
              </div>

              <div
                className="prose-article space-y-4 text-[15px] leading-[1.85] text-ink-700"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />

              {tags.length > 0 && (
                <div className="mt-9 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-6">
                  <Tag className="h-3.5 w-3.5 text-ink-400" />
                  {tags.map((t) => (
                    <span key={t} className="rounded-full bg-ink-100 px-3 py-1 text-[12px] font-semibold text-ink-600">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-10 rounded-3xl bg-gradient-to-br from-brand-600 to-ink-900 p-7 text-center">
                <h2 className="font-display text-xl font-bold text-white">
                  Ready to shop authentic Bangladeshi fashion?
                </h2>
                <p className="mt-2 text-[15px] text-ink-200">
                  Free delivery over ৳{config.freeShippingOver} · Cash on delivery nationwide
                </p>
                <Link href="/shop" className="btn-lg mt-5 bg-white font-bold text-ink-900 hover:bg-ink-100">
                  Browse the Shop
                </Link>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <aside className="space-y-5 lg:sticky lg:top-32 lg:h-fit">
              {popular.length > 0 && (
                <section className="rounded-2xl border border-ink-200 bg-white p-4">
                  <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-ink-500">
                    <Flame className="h-3.5 w-3.5 text-accent" /> Popular
                  </h2>
                  <ol className="space-y-3">
                    {popular.map((p, i) => (
                      <li key={p.id}>
                        <Link href={`/blog/${p.slug}`} className="group flex gap-3">
                          <span className="font-display text-[18px] font-bold leading-none text-ink-200">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block text-[13px] font-semibold leading-snug text-ink-800 group-hover:text-brand-700">
                              {p.title}
                            </span>
                            <span className="mt-1 block text-[11px] text-ink-400">
                              {p.viewCount.toLocaleString()} views
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {categories.length > 0 && (
                <section className="rounded-2xl border border-ink-200 bg-white p-4">
                  <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-ink-500">
                    <FolderOpen className="h-3.5 w-3.5 text-brand-600" /> Categories
                  </h2>
                  <ul className="space-y-0.5">
                    {categories.map((c) => (
                      <li key={c.name}>
                        <Link
                          href={`/blog?category=${encodeURIComponent(c.name)}`}
                          className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] text-ink-700 transition hover:bg-ink-50 hover:text-brand-700"
                        >
                          <span className="capitalize">{c.name.replace(/-/g, ' ')}</span>
                          <span className="text-[11px] font-semibold text-ink-400">{c.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {recent.length > 0 && (
                <section className="rounded-2xl border border-ink-200 bg-white p-4">
                  <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-ink-500">
                    <Clock className="h-3.5 w-3.5 text-brand-600" /> Recent
                  </h2>
                  <ul className="space-y-3">
                    {recent.map((p) => (
                      <li key={p.id}>
                        <Link href={`/blog/${p.slug}`} className="group flex gap-3">
                          <span className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                            {p.coverImage && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imageAt(p.coverImage, 160, 60)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block text-[13px] font-semibold leading-snug text-ink-800 group-hover:text-brand-700">
                              {p.title}
                            </span>
                            <span className="mt-1 block text-[11px] text-ink-400">
                              {formatDate(p.publishedAt)} · {p.readMinutes} min
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-14 border-t border-ink-200 pt-10">
              <h2 className="mb-6 font-display text-2xl font-bold text-ink-900">Related Articles</h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {related.map((r) => (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="group">
                    <div className="aspect-[16/10] overflow-hidden rounded-xl bg-ink-100">
                      {r.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageAt(r.coverImage, 480, 65)}
                          srcSet={srcSetFor(r.coverImage, CARD_WIDTHS, 65)}
                          sizes="(min-width: 640px) 30vw, 100vw"
                          alt={r.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-ink-900 group-hover:text-brand-700">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-ink-400">
                      {formatDate(r.publishedAt)} · {r.readMinutes} min
                    </p>
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
