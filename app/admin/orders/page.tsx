import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Filter, Download, Eye, Package } from 'lucide-react';
import prisma from '@/lib/db';
import {
  formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR,
  PAYMENT_METHOD_LABEL, cn, parseJSON,
} from '@/lib/utils';

export const metadata: Metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; payment?: string; page?: string; from?: string; to?: string };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const perPage = 25;
  const q = searchParams.q?.trim();

  const where: any = {};
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { customerName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { trackingNumber: { contains: q } },
    ];
  }
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.payment) where.paymentMethod = searchParams.payment;

  const [orders, total, statusCounts, agg] = await Promise.all([
    prisma.order.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage, take: perPage,
      include: { items: { take: 1 } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true }, _sum: { total: true } }),
    prisma.order.aggregate({ where, _sum: { total: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s]));
  const allCount = statusCounts.reduce((s, c) => s + c._count._all, 0);

  const statusTabs = [
    { key: '', label: 'All', count: allCount },
    { key: 'PENDING', label: 'Pending', count: statusMap.PENDING?._count._all || 0 },
    { key: 'PROCESSING', label: 'Processing', count: statusMap.PROCESSING?._count._all || 0 },
    { key: 'CONFIRMED', label: 'Confirmed', count: statusMap.CONFIRMED?._count._all || 0 },
    { key: 'SHIPPED', label: 'Shipped', count: statusMap.SHIPPED?._count._all || 0 },
    { key: 'DELIVERED', label: 'Delivered', count: statusMap.DELIVERED?._count._all || 0 },
    { key: 'CANCELLED', label: 'Cancelled', count: statusMap.CANCELLED?._count._all || 0 },
  ];

  function tabHref(key: string) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (key) sp.set('status', key);
    if (searchParams.payment) sp.set('payment', searchParams.payment);
    return `/admin/orders${sp.toString() ? '?' + sp.toString() : ''}`;
  }

  function pageHref(n: number) {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (searchParams.status) sp.set('status', searchParams.status);
    if (searchParams.payment) sp.set('payment', searchParams.payment);
    sp.set('page', String(n));
    return `/admin/orders?${sp.toString()}`;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Orders</h1>
          <p className="mt-1 text-[15px] text-ink-500">
            {total} orders · {formatPrice(agg._sum.total || 0)} total value
          </p>
        </div>
        <Link href="/api/admin/orders/export" className="btn-outline btn-sm">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-ink-200 pb-px no-scrollbar">
        {statusTabs.map((t) => {
          const active = (searchParams.status || '') === t.key;
          return (
            <Link
              key={t.key || 'all'}
              href={tabHref(t.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-[13px] font-bold transition',
                active ? 'border-b-2 border-brand-600 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
              )}
            >
              {t.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[12px]',
                active ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-500'
              )}>
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Search */}
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-ink-200 bg-white p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="label">Search Orders</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input id="q" name="q" defaultValue={q} placeholder="Order #, customer, phone, tracking…" className="input py-2 pl-9 text-[13px]" />
          </div>
        </div>
        <div>
          <label htmlFor="payment" className="label">Payment Method</label>
          <select id="payment" name="payment" defaultValue={searchParams.payment || ''} className="select py-2 text-[13px]">
            <option value="">All Methods</option>
            <option value="cod">Cash on Delivery</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
            <option value="sslcommerz">SSLCommerz / Card</option>
          </select>
        </div>
        {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
        <button type="submit" className="btn-dark btn-sm"><Filter className="h-3.5 w-3.5" /> Search</button>
        <Link href="/admin/orders" className="btn-ghost btn-sm">Reset</Link>
      </form>

      {/* Table */}
      <div className="table-wrap">
        <table className="w-full min-w-[980px]">
          <thead className="border-b border-ink-100 bg-ink-50/60">
            <tr>
              <th className="th w-10">
                <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" aria-label="Select all" />
              </th>
              <th className="th">Order</th>
              <th className="th">Customer</th>
              <th className="th">Items</th>
              <th className="th">Payment</th>
              <th className="th">Status</th>
              <th className="th">District</th>
              <th className="th">Date</th>
              <th className="th text-right">Total</th>
              <th className="th text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {orders.map((o) => {
              const img = o.items[0]?.image;
              return (
                <tr key={o.id} className="transition hover:bg-ink-50/50">
                  <td className="td">
                    <input type="checkbox" className="h-4 w-4 rounded border-ink-300 text-brand-600" aria-label={`Select ${o.orderNumber}`} />
                  </td>
                  <td className="td">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] font-bold text-brand-700 hover:underline">
                      {o.orderNumber}
                    </Link>
                    {o.trackingNumber && (
                      <p className="mt-0.5 font-mono text-[12px] text-ink-400">{o.trackingNumber}</p>
                    )}
                  </td>
                  <td className="td">
                    <p className="text-[13px] font-semibold text-ink-800">{o.customerName}</p>
                    <p className="text-[12px] text-ink-400">{o.phone}</p>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      {img && (
                        <div className="h-9 w-8 shrink-0 overflow-hidden rounded bg-ink-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <span className="text-[12px] text-ink-500">
                        {o.items.reduce((s, i) => s + i.qty, 0)} item
                        {o.items.reduce((s, i) => s + i.qty, 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="td">
                    <p className="text-[12px] font-medium text-ink-700">{PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod}</p>
                    <span className={cn('badge mt-0.5', o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800')}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="td">
                    <span className={cn('badge border', ORDER_STATUS_COLOR[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="td text-[12px] text-ink-600">{o.shipDistrict}</td>
                  <td className="td">
                    <p className="text-[12px] text-ink-700">{formatDate(o.createdAt)}</p>
                    <p className="text-[12px] text-ink-400">
                      {new Date(o.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="td text-right">
                    <p className="text-[13px] font-bold text-ink-900">{formatPrice(o.total)}</p>
                    {o.discount > 0 && <p className="text-[12px] text-emerald-600">−{formatPrice(o.discount)}</p>}
                  </td>
                  <td className="td text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-brand-700"
                    >
                      <Eye className="h-3 w-3" /> View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-9 w-9 text-ink-300" />
            <p className="text-[15px] font-semibold text-ink-700">No orders found</p>
            <p className="mt-1 text-[13px] text-ink-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-ink-500">Page {page} of {totalPages}</p>
          <div className="flex gap-1.5">
            {page > 1 && <Link href={pageHref(page - 1)} className="btn-outline btn-sm">← Prev</Link>}
            {page < totalPages && <Link href={pageHref(page + 1)} className="btn-outline btn-sm">Next →</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
