import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, MessageSquare, ShieldAlert, Star, ThumbsUp } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber, timeAgo } from '@/lib/utils';
import ReviewModeration from '@/components/admin/ReviewModeration';

export const metadata: Metadata = { title: 'Reviews' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const status = searchParams.status || 'pending';
  const q = searchParams.q?.trim() || '';
  const page = Math.max(1, Number(searchParams.page || 1));

  const where: any = {};
  if (status !== 'all') where.status = status;
  if (q) {
    where.OR = [
      { authorName: { contains: q } },
      { body: { contains: q } },
      { title: { contains: q } },
      { product: { name: { contains: q } } },
    ];
  }

  const [reviews, total, counts] = await Promise.all([
    prisma.review.findMany({
      where,
      include: { product: { select: { name: true, slug: true } }, customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ['status'], _count: true }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const totalAll = counts.reduce((s, c) => s + c._count, 0);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const verified = reviews.filter((r) => r.verified).length;

  const tabs = [
    { key: 'pending', label: 'Pending', count: countMap.pending || 0, tone: 'text-amber-600' },
    { key: 'approved', label: 'Approved', count: countMap.approved || 0, tone: 'text-emerald-600' },
    { key: 'spam', label: 'Spam', count: countMap.spam || 0, tone: 'text-rose-600' },
    { key: 'all', label: 'All', count: totalAll, tone: 'text-ink-600' },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Reviews</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Moderate customer feedback. Approving a review recalculates the product&apos;s average rating instantly.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Awaiting moderation" value={formatNumber(countMap.pending || 0)} icon={ShieldAlert} tone="bg-amber-50 text-amber-700" />
        <Stat label="Published" value={formatNumber(countMap.approved || 0)} icon={MessageSquare} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Average (this page)" value={avg ? avg.toFixed(1) : '—'} icon={Star} tone="bg-brand-50 text-brand-700" />
        <Stat label="Verified buyers" value={formatNumber(verified)} icon={ThumbsUp} tone="bg-blue-50 text-blue-700" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-x flex gap-1.5 pb-1">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/reviews?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`chip whitespace-nowrap ${status === t.key ? 'chip-active' : ''}`}
            >
              {t.label}
              <span className="rounded-full bg-black/10 px-1.5 text-[12px]">{t.count}</span>
            </Link>
          ))}
        </div>

        <form action="/admin/reviews" className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search reviews…"
            className="input sm:w-64"
          />
          <button className="btn-dark btn-sm whitespace-nowrap">Search</button>
        </form>
      </div>

      <ReviewModeration
        reviews={reviews.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          authorEmail: r.authorEmail,
          rating: r.rating,
          title: r.title,
          body: r.body,
          status: r.status,
          verified: r.verified,
          helpful: r.helpful,
          createdAt: r.createdAt.toISOString(),
          ago: timeAgo(r.createdAt),
          productName: r.product?.name || 'Deleted product',
          productSlug: r.product?.slug ?? null,
        }))}
      />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5">
          {page > 1 && (
            <Link
              href={`/admin/reviews?status=${status}&q=${encodeURIComponent(q)}&page=${page - 1}`}
              className="btn-outline btn-sm"
            >
              Previous
            </Link>
          )}
          <span className="px-3 text-[15px] text-ink-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/reviews?status=${status}&q=${encodeURIComponent(q)}&page=${page + 1}`}
              className="btn-outline btn-sm"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
