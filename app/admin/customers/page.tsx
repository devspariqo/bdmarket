import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin, TrendingUp, UserCheck, Users } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber, formatPrice, formatDate } from '@/lib/utils';
import CustomerTable from '@/components/admin/CustomerTable';

export const metadata: Metadata = { title: 'Customers' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q?.trim() || '';
  const sort = searchParams.sort || 'recent';
  const page = Math.max(1, Number(searchParams.page || 1));

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { district: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  const orderBy: any =
    sort === 'spent' ? { totalSpent: 'desc' }
    : sort === 'orders' ? { orderCount: 'desc' }
    : sort === 'name' ? { name: 'asc' }
    : { createdAt: 'desc' };

  const [customers, total, agg] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { orders: true, reviews: true } } },
    }),
    prisma.customer.count({ where }),
    prisma.customer.aggregate({
      _sum: { totalSpent: true, orderCount: true },
      _count: true,
      _avg: { totalSpent: true },
    }),
  ]);

  const returning = await prisma.customer.count({ where: { orderCount: { gt: 1 } } });
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const sorts = [
    { key: 'recent', label: 'Newest' },
    { key: 'spent', label: 'Top spenders' },
    { key: 'orders', label: 'Most orders' },
    { key: 'name', label: 'A–Z' },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Sales</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Customers</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Everyone who has ordered or registered — with lifetime value and segmentation tags.
          </p>
        </div>
        <Link href="/api/admin/customers/export" className="btn-outline btn-sm">
          Export CSV
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total customers" value={formatNumber(agg._count)} icon={Users} tone="bg-brand-50 text-brand-700" />
        <Stat label="Returning" value={formatNumber(returning)} icon={UserCheck} tone="bg-emerald-50 text-emerald-700" />
        <Stat
          label="Lifetime revenue"
          value={formatPrice(agg._sum.totalSpent || 0)}
          icon={TrendingUp}
          tone="bg-blue-50 text-blue-700"
        />
        <Stat
          label="Avg. lifetime value"
          value={formatPrice(Math.round(agg._avg.totalSpent || 0))}
          icon={TrendingUp}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-x flex gap-1.5 pb-1">
          {sorts.map((s) => (
            <Link
              key={s.key}
              href={`/admin/customers?sort=${s.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`chip whitespace-nowrap ${sort === s.key ? 'chip-active' : ''}`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <form action="/admin/customers" className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="sort" value={sort} />
          <input name="q" defaultValue={q} placeholder="Name, email, phone…" className="input sm:w-64" />
          <button className="btn-dark btn-sm whitespace-nowrap">Search</button>
        </form>
      </div>

      <CustomerTable
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          district: c.district,
          tags: c.tags,
          totalSpent: c.totalSpent,
          orderCount: c.orderCount,
          reviewCount: c._count.reviews,
          acceptsMarketing: c.acceptsMarketing,
          joined: formatDate(c.createdAt),
        }))}
      />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5">
          {page > 1 && (
            <Link href={`/admin/customers?sort=${sort}&q=${encodeURIComponent(q)}&page=${page - 1}`} className="btn-outline btn-sm">
              Previous
            </Link>
          )}
          <span className="px-3 text-[15px] text-ink-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/customers?sort=${sort}&q=${encodeURIComponent(q)}&page=${page + 1}`} className="btn-outline btn-sm">
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
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 truncate font-display text-xl font-bold text-ink-900">{value}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
