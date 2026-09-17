import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Package, Wallet,
  AlertTriangle, ArrowRight, Star, Clock, BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import prisma from '@/lib/db';
import {
  dashboardStats, revenueSeries, statusBreakdown, topProducts,
  recentOrders, lowStockList, topDistricts, topCategories,
} from '@/lib/analytics';
import {
  formatPrice, formatNumber, formatCompact, timeAgo,
  ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_METHOD_LABEL, cn,
} from '@/lib/utils';
import RevenueChart from '@/components/admin/charts/RevenueChart';
import StatusDonut from '@/components/admin/charts/StatusDonut';
import CategoryBar from '@/components/admin/charts/CategoryBar';
import { getAdminBase } from '@/lib/admin-path';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const base = await getAdminBase();
  const [stats, series, statuses, tops, orders, lowStock, districts, categories] = await Promise.all([
    dashboardStats(),
    revenueSeries(30),
    statusBreakdown(),
    topProducts(6),
    recentOrders(8),
    lowStockList(6),
    topDistricts(6),
    topCategories(6),
  ]);

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      sub: `${formatPrice(stats.revenue30)} last 30 days`,
      change: stats.revGrowth,
      icon: Wallet,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      sub: `${stats.todayOrders} today · ${stats.pendingOrders} pending`,
      change: stats.ordGrowth,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Customers',
      value: formatNumber(stats.totalCustomers),
      sub: `${stats.newCustomers30} new in 30 days`,
      change: stats.newCustomers30 > 0 ? 12.5 : 0,
      icon: Users,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Products',
      value: formatNumber(stats.totalProducts),
      sub: `${stats.lowStockProducts} low · ${stats.outOfStock} out of stock`,
      icon: Package,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Store performance overview · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link href={`${base}/products/new`} className="btn-dark btn-sm">+ Add Product</Link>
          <Link href={`${base}/orders`} className="btn-outline btn-sm">View Orders</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition hover:shadow-card">
            <div className="flex items-start justify-between">
              <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', k.color)}>
                <k.icon className="h-5 w-5" />
              </span>
              {k.change !== undefined && k.change !== 0 && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[12px] font-bold',
                  k.change > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                )}>
                  {k.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(k.change).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="mt-4 font-display text-2xl font-bold tracking-tight text-ink-900">{k.value}</p>
            <p className="mt-0.5 text-[13px] font-semibold text-ink-600">{k.label}</p>
            <p className="mt-1 text-[12px] text-ink-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: 'Avg. Order Value', v: formatPrice(stats.aov), i: TrendingUp, c: 'text-brand-600' },
          { l: 'Pending Reviews', v: formatNumber(stats.pendingReviews), i: Star, c: 'text-amber-600' },
          { l: 'Low Stock Items', v: formatNumber(stats.lowStockProducts), i: AlertTriangle, c: 'text-rose-600' },
          { l: 'Repeat Rate', v: `${((stats.totalOrders / Math.max(stats.totalCustomers, 1) - 1) * 100).toFixed(0)}%`, i: Users, c: 'text-violet-600' },
        ].map((m) => (
          <div key={m.l} className="flex items-center gap-3.5 rounded-2xl border border-ink-200/70 bg-white p-4">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50', m.c)}>
              <m.i className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink-900">{m.v}</p>
              <p className="text-[12px] font-semibold text-ink-500">{m.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Revenue Overview</h2>
              <p className="mt-0.5 text-[13px] text-ink-500">Last 30 days performance</p>
            </div>
            <Link href={`${base}/analytics`} className="text-[13px] font-semibold text-brand-700 hover:underline">
              Details →
            </Link>
          </div>
          <RevenueChart data={series} />
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-bold text-ink-900">Order Status</h2>
          <p className="mt-0.5 mb-4 text-[13px] text-ink-500">Distribution across all orders</p>
          <StatusDonut data={statuses} />
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Recent orders */}
        <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold text-ink-900">Recent Orders</h2>
            <Link href={`${base}/orders`} className="text-[13px] font-semibold text-brand-700 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink-100 bg-ink-50/50">
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Customer</th>
                  <th className="th">Payment</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-ink-50/50">
                    <td className="td">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-bold text-brand-700 hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-ink-400">{timeAgo(o.createdAt)}</p>
                    </td>
                    <td className="td">
                      <p className="text-[13px] font-semibold text-ink-800">{o.customerName}</p>
                    </td>
                    <td className="td">
                      <span className="text-[12px] font-medium text-ink-600">
                        {PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod}
                      </span>
                    </td>
                    <td className="td">
                      <span className={cn('badge border', ORDER_STATUS_COLOR[o.status])}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="td text-right font-bold text-ink-900">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-ink-200/70 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="font-display text-lg font-bold text-ink-900">Top Selling</h2>
            <Link href={`${base}/products`} className="text-[13px] font-semibold text-brand-700 hover:underline">All →</Link>
          </div>
          <div className="divide-y divide-ink-100">
            {tops.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-[12px] font-bold text-ink-600">
                  {i + 1}
                </span>
                <div className="h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[13px] font-semibold text-ink-800">{p.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink-400">{p.qty} sold</p>
                </div>
                <span className="text-[13px] font-bold text-ink-900">{formatPrice(p.revenue)}</span>
              </div>
            ))}
            {tops.length === 0 && <p className="px-5 py-8 text-center text-[13px] text-ink-400">No sales data yet</p>}
          </div>
        </div>
      </div>

      {/* Category performance + low stock */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft">
          <h2 className="mb-1 font-display text-lg font-bold text-ink-900">Category Performance</h2>
          <p className="mb-5 text-[13px] text-ink-500">Revenue generated by category</p>
          <CategoryBar data={categories} />
        </div>

        <div className="rounded-2xl border border-ink-200/70 bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Low Stock
            </h2>
            <Link href={`${base}/inventory`} className="text-[13px] font-semibold text-brand-700 hover:underline">Manage →</Link>
          </div>
          <div className="divide-y divide-ink-100">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="h-11 w-9 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {safeImg(p.images) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={safeImg(p.images)} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="line-clamp-1 text-[13px] font-semibold text-ink-800 hover:text-brand-700">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[12px] text-ink-400">{p.sku}</p>
                </div>
                <span className={cn(
                  'shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-bold',
                  p.stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                )}>
                  {p.stock <= 0 ? 'Out' : `${p.stock} left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className="px-5 py-8 text-center text-[13px] text-emerald-600">All products well stocked ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* Districts */}
      <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft">
        <h2 className="mb-1 font-display text-lg font-bold text-ink-900">Top Delivery Districts</h2>
        <p className="mb-4 text-[13px] text-ink-500">Where your orders are going</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {districts.map((d) => (
            <div key={d.district} className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-ink-800">{d.district}</p>
                <p className="mt-0.5 text-[12px] text-ink-400">{d.orders} orders</p>
              </div>
              <span className="text-[15px] font-bold text-ink-900">{formatPrice(d.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function safeImg(images: string) {
  try {
    const a = JSON.parse(images);
    return Array.isArray(a) ? a[0] || '' : '';
  } catch {
    return '';
  }
}
