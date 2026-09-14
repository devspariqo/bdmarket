import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Boxes, Eye, Globe, MapPin,
  MousePointerClick, Search, ShoppingBag, TrendingUp, Users,
} from 'lucide-react';
import prisma from '@/lib/db';
import {
  dashboardStats, revenueSeries, topProducts, topCategories,
  topDistricts, statusBreakdown, paymentBreakdown,
} from '@/lib/analytics';
import { formatCompact, formatNumber, formatPrice, timeAgo } from '@/lib/utils';
import RevenueChart from '@/components/admin/charts/RevenueChart';
import StatusDonut from '@/components/admin/charts/StatusDonut';
import CategoryBar from '@/components/admin/charts/CategoryBar';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const days = Math.min(365, Math.max(7, Number(searchParams.days || 30)));

  const [stats, series, products, cats, districts, statuses, payments] = await Promise.all([
    dashboardStats(),
    revenueSeries(days),
    topProducts(10),
    topCategories(8),
    topDistricts(8),
    statusBreakdown(),
    paymentBreakdown(),
  ]);

  const since = new Date(Date.now() - days * 86400000);

  const [searchTerms, pageViews, newCustomers, prevSeries] = await Promise.all([
    prisma.searchQuery.groupBy({
      by: ['query'],
      _count: true,
      orderBy: { _count: { query: 'desc' } },
      take: 10,
      where: { createdAt: { gte: since } },
    }),
    prisma.pageView.count({ where: { createdAt: { gte: since } } }),
    prisma.customer.count({ where: { createdAt: { gte: since } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: new Date(Date.now() - days * 2 * 86400000), lt: since } },
      select: { total: true, status: true },
    }),
  ]);

  const revenueStatuses = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
  const currentRevenue = series.reduce((s, d) => s + d.revenue, 0);
  const prevRevenue = prevSeries
    .filter((o) => revenueStatuses.includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  const growth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const ranges = [7, 30, 90, 180, 365];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Performance for the last {days} days, compared with the previous {days} days.
          </p>
        </div>
        <div className="flex gap-1.5">
          {ranges.map((r) => (
            <Link key={r} href={`/admin/analytics?days=${r}`} className={`chip ${days === r ? 'chip-active' : ''}`}>
              {r === 365 ? '1y' : `${r}d`}
            </Link>
          ))}
        </div>
      </header>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Revenue"
          value={formatPrice(currentRevenue)}
          delta={growth}
          icon={TrendingUp}
          tone="bg-brand-50 text-brand-700"
        />
        <Kpi
          label="Orders"
          value={formatNumber(series.reduce((s, d) => s + d.orders, 0))}
          icon={ShoppingBag}
          tone="bg-blue-50 text-blue-700"
        />
        <Kpi label="New customers" value={formatNumber(newCustomers)} icon={Users} tone="bg-violet-50 text-violet-700" />
        <Kpi label="Page views" value={formatNumber(pageViews)} icon={Eye} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini label="Avg. order value" value={formatPrice(stats.aov)} />
        <Mini label="Units sold" value={formatNumber(stats.unitsSold)} />
        <Mini label="Conversion rate" value={`${stats.conversionRate.toFixed(2)}%`} />
        <Mini label="Total products" value={formatNumber(stats.totalProducts)} />
      </div>

      {/* Chart + donut */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">Revenue trend</h2>
              <p className="text-[13px] text-ink-400">Confirmed orders onwards — cancellations excluded</p>
            </div>
            <span className="badge border border-ink-200 bg-white text-ink-600">{days} days</span>
          </div>
          <div className="mt-4">
            <RevenueChart data={series} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-base font-bold text-ink-900">Order status</h2>
          <p className="text-[13px] text-ink-400">All-time distribution</p>
          <div className="mt-4">
            <StatusDonut data={statuses} />
          </div>
        </div>
      </div>

      {/* Category + districts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-base font-bold text-ink-900">Revenue by category</h2>
          <p className="text-[13px] text-ink-400">Top {cats.length} categories by sales value</p>
          <div className="mt-4">
            <CategoryBar data={cats} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-700" />
            <h2 className="font-display text-base font-bold text-ink-900">Top districts</h2>
          </div>
          <p className="text-[13px] text-ink-400">Where your orders actually ship to</p>
          <div className="mt-4 space-y-3">
            {districts.length ? (
              districts.map((d, i) => {
                const max = districts[0].revenue || 1;
                const pct = Math.round((d.revenue / max) * 100);
                return (
                  <div key={d.district}>
                    <div className="flex items-baseline justify-between text-[15px]">
                      <span className="flex items-center gap-1.5 font-medium text-ink-800">
                        <span className="grid h-5 w-5 place-items-center rounded bg-ink-100 text-[12px] font-bold text-ink-500">
                          {i + 1}
                        </span>
                        {d.district}
                      </span>
                      <span className="tabular-nums text-ink-600">
                        {formatPrice(d.revenue)}
                        <span className="ml-1.5 text-[13px] text-ink-400">{d.orders} orders</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-[15px] text-ink-400">No shipping data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Products + payments + searches */}
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 p-5">
            <h2 className="font-display text-base font-bold text-ink-900">Top selling products</h2>
            <p className="text-[13px] text-ink-400">Ranked by units sold across all time</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-ink-50/70">
                <tr>
                  <th className="th w-10">#</th>
                  <th className="th">Product</th>
                  <th className="th">Sold</th>
                  <th className="th">Revenue</th>
                  <th className="th">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.length ? (
                  products.map((p, i) => (
                    <tr key={p.id} className="border-b border-ink-100 last:border-0">
                      <td className="td text-ink-400">{i + 1}</td>
                      <td className="td">
                        <Link href={`/admin/products/${p.id}`} className="font-medium text-ink-900 hover:text-brand-700">
                          {p.name}
                        </Link>
                      </td>
                      <td className="td font-semibold">{formatNumber(p.sold)}</td>
                      <td className="td">{formatPrice(p.revenue)}</td>
                      <td className="td">
                        <span
                          className={
                            p.stock <= 0
                              ? 'badge border border-rose-200 bg-rose-50 text-rose-700'
                              : p.stock <= 10
                              ? 'badge border border-amber-200 bg-amber-50 text-amber-700'
                              : 'badge border border-ink-200 bg-ink-50 text-ink-600'
                          }
                        >
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="td py-10 text-center text-ink-400">
                      No sales data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
              <BarChart3 className="h-4 w-4 text-brand-700" /> Payment methods
            </h2>
            <div className="mt-4 space-y-3">
              {payments.length ? (
                payments.map((p) => {
                  const total = payments.reduce((s, x) => s + x.count, 0) || 1;
                  const pct = Math.round((p.count / total) * 100);
                  return (
                    <div key={p.method}>
                      <div className="flex items-baseline justify-between text-[15px]">
                        <span className="font-medium capitalize text-ink-800">{p.method}</span>
                        <span className="text-ink-500">
                          {formatNumber(p.count)} <span className="text-[13px] text-ink-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(3, pct)}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-[15px] text-ink-400">No payment data yet.</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
              <Search className="h-4 w-4 text-brand-700" /> Top searches
            </h2>
            <p className="text-[13px] text-ink-400">Last {days} days</p>
            <div className="mt-3 space-y-1.5">
              {searchTerms.length ? (
                searchTerms.map((s, i) => (
                  <Link
                    key={s.query}
                    href={`/admin/products?q=${encodeURIComponent(s.query)}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[15px] transition hover:bg-ink-50"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-[13px] text-ink-400">#{i + 1}</span>
                      <span className="truncate text-ink-700">{s.query}</span>
                    </span>
                    <span className="badge border border-ink-200 bg-white text-ink-500">{s._count}</span>
                  </Link>
                ))
              ) : (
                <p className="py-6 text-center text-[15px] text-ink-400">No searches recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Mini label="Pending orders" value={formatNumber(stats.pendingOrders)} />
        <Mini label="Low stock items" value={formatNumber(stats.lowStock)} />
        <Mini label="Published products" value={formatNumber(stats.publishedProducts)} />
        <Mini label="Total customers" value={formatNumber(stats.totalCustomers)} />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  delta?: number;
  icon: any;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 truncate font-display text-xl font-bold text-ink-900 sm:text-2xl">{value}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {delta !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-[13px] font-semibold">
          {delta >= 0 ? (
            <>
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-600">{delta.toFixed(1)}%</span>
            </>
          ) : (
            <>
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
              <span className="text-rose-600">{Math.abs(delta).toFixed(1)}%</span>
            </>
          )}
          <span className="font-normal text-ink-400">vs previous period</span>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200/70 bg-white px-4 py-3 shadow-soft">
      <p className="truncate text-[12px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}
