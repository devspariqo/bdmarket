import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import prisma from '@/lib/db';
import {
  formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR,
  PAYMENT_METHOD_LABEL, cn,
} from '@/lib/utils';
import OrderStatusUpdater from '@/components/admin/OrderStatusUpdater';

export const metadata: Metadata = { title: 'Order Details' };
export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      customer: true,
    },
  });

  if (!order) notFound();

  const relatedOrders = order.customerId
    ? await prisma.order.count({ where: { customerId: order.customerId } })
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
              Order #{order.orderNumber}
            </h1>
            <span className={cn('badge border', ORDER_STATUS_COLOR[order.status])}>
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            <span className={cn('badge', order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
            </span>
          </div>
          <p className="mt-1.5 text-[15px] text-ink-500">
            Placed {formatDate(order.createdAt, 'datetime')} · {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
          </p>
        </div>
        <div className="flex gap-2.5 no-print">
          <Link href={`/order/${order.orderNumber}`} target="_blank" className="btn-outline btn-sm">
            View customer page
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <h2 className="border-b border-ink-100 px-5 py-4 font-display text-base font-bold text-ink-900">
              Order Items ({order.items.length})
            </h2>
            <div className="divide-y divide-ink-100">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3.5 px-5 py-4">
                  <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink-900">{it.productName}</p>
                    {it.variant && <p className="mt-0.5 text-[12px] text-ink-500">{it.variant}</p>}
                    {it.sku && <p className="mt-0.5 font-mono text-[12px] text-ink-400">SKU: {it.sku}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] text-ink-500">{formatPrice(it.price)} × {it.qty}</p>
                    <p className="mt-0.5 text-[15px] font-bold text-ink-900">{formatPrice(it.total)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-4">
              <dl className="ml-auto max-w-xs space-y-2 text-[15px]">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd className="font-semibold text-ink-900">{formatPrice(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-emerald-700">Discount {order.couponCode && `(${order.couponCode})`}</dt>
                    <dd className="font-semibold text-emerald-700">−{formatPrice(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-600">Shipping ({order.shippingZone})</dt>
                  <dd className="font-semibold text-ink-900">
                    {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-ink-200 pt-2.5">
                  <dt className="font-bold text-ink-900">Total</dt>
                  <dd className="font-display text-lg font-bold text-ink-900">{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-4 font-display text-base font-bold text-ink-900">Order Timeline</h2>
            <ol className="space-y-4">
              {order.timeline.map((ev, i) => (
                <li key={ev.id} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      i === order.timeline.length - 1 ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-ink-300'
                    )} />
                    {i < order.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-200" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-[15px] font-semibold text-ink-900">
                      {ORDER_STATUS_LABEL[ev.status] || ev.status}
                    </p>
                    {ev.note && <p className="text-[13px] text-ink-500">{ev.note}</p>}
                    <p className="mt-0.5 text-[12px] text-ink-400">
                      {formatDate(ev.createdAt, 'datetime')}{ev.by ? ` · ${ev.by}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Notes */}
          {(order.customerNote || order.adminNote) && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-3 font-display text-base font-bold text-ink-900">Notes</h2>
              {order.customerNote && (
                <div className="mb-3 rounded-xl bg-amber-50 p-3.5">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-amber-700">Customer Note</p>
                  <p className="mt-1 text-[13px] text-amber-900">{order.customerNote}</p>
                </div>
              )}
              {order.adminNote && (
                <div className="rounded-xl bg-ink-50 p-3.5">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-ink-500">Admin Note</p>
                  <p className="mt-1 text-[13px] text-ink-700">{order.adminNote}</p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right column */}
        <aside className="space-y-5">
          {/* Status updater */}
          <OrderStatusUpdater
            orderId={order.id}
            currentStatus={order.status}
            paymentStatus={order.paymentStatus}
            trackingNumber={order.trackingNumber}
            courier={order.courier}
            adminNote={order.adminNote || ''}
          />

          {/* Customer */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 font-display text-base font-bold text-ink-900">Customer</h2>
            <p className="text-[15px] font-bold text-ink-900">{order.customerName}</p>
            <div className="mt-2 space-y-1.5 text-[13px] text-ink-600">
              <p>{order.email}</p>
              <p>{order.phone}</p>
              {relatedOrders > 0 && (
                <p className="pt-1 text-[12px] font-semibold text-brand-700">
                  {relatedOrders} total order{relatedOrders > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {order.customerId && (
              <Link href={`/admin/customers/${order.customerId}`} className="btn-outline btn-sm mt-3 w-full">
                View Customer Profile
              </Link>
            )}
          </section>

          {/* Shipping address */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 font-display text-base font-bold text-ink-900">Shipping Address</h2>
            <address className="text-[13px] not-italic leading-relaxed text-ink-600">
              <span className="font-semibold text-ink-800">{order.customerName}</span><br />
              {order.shipStreet}<br />
              {order.shipArea && <>{order.shipArea}<br /></>}
              {order.shipDistrict}, {order.shipDivision}<br />
              {order.shipPostcode && <>Post code: {order.shipPostcode}<br /></>}
              {order.phone}
            </address>
            <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-[12px]">
              <div className="flex justify-between">
                <span className="text-ink-500">Zone</span>
                <span className="font-semibold text-ink-800">{order.shippingZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Method</span>
                <span className="font-semibold text-ink-800">{order.shippingMethod}</span>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 font-display text-base font-bold text-ink-900">Payment</h2>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-ink-500">Method</dt>
                <dd className="font-semibold text-ink-800">{PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Status</dt>
                <dd className="font-semibold text-ink-800">{order.paymentStatus}</dd>
              </div>
              {order.paymentRef && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">Reference</dt>
                  <dd className="font-mono text-[12px] font-semibold text-ink-800">{order.paymentRef}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-500">Amount</dt>
                <dd className="font-bold text-ink-900">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Meta */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 font-display text-base font-bold text-ink-900">Order Meta</h2>
            <dl className="space-y-2 text-[12px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Order ID</dt>
                <dd className="truncate font-mono text-ink-700">{order.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">IP Address</dt>
                <dd className="font-mono text-ink-700">{order.ipAddress || '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Last updated</dt>
                <dd className="text-ink-700">{formatDate(order.updatedAt, 'datetime')}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
