import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2, Package, Truck, MapPin, Phone, Mail, Copy, Printer,
  CreditCard, MessageSquare,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { formatPrice, formatDate, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, ORDER_STATUS_COLOR, cn } from '@/lib/utils';
import OrderTracker from '@/components/store/OrderTracker';

export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function OrderPage({
  params, searchParams,
}: {
  params: { orderNumber: string };
  searchParams: { pay?: string };
}) {
  const config = await getSiteConfig();

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: true, timeline: { orderBy: { createdAt: 'asc' } } },
  });

  if (!order) notFound();

  const steps = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
  const currentIdx = steps.indexOf(order.status);
  const cancelled = ['CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status);

  return (
    <div className="container-x py-8">
      {/* Success header */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center sm:p-8">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {cancelled ? 'Order Status' : 'Thank you for your order!'}
        </h1>
        <p className="mt-2 text-[15px] text-ink-600">
          {cancelled
            ? 'This order is no longer active.'
            : 'Your order has been placed successfully. We will call you shortly to confirm.'}
        </p>

        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-ink-200 bg-white px-5 py-3">
          <div className="text-left">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Order Number</p>
            <p className="font-display text-lg font-bold text-ink-900">{order.orderNumber}</p>
          </div>
          <span className="hidden h-8 w-px bg-ink-200 sm:block" />
          <div className="text-left">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Order Total</p>
            <p className="font-display text-lg font-bold text-ink-900">{formatPrice(order.total)}</p>
          </div>
          <span className="hidden h-8 w-px bg-ink-200 sm:block" />
          <div className="text-left">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Placed On</p>
            <p className="text-[15px] font-semibold text-ink-800">{formatDate(order.createdAt, 'long')}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link href="/shop" className="btn-primary">Continue Shopping</Link>
          <Link href={`/account/orders`} className="btn-outline">My Orders</Link>
        </div>
      </div>

      {/* Mobile payment instruction */}
      {searchParams.pay && order.paymentStatus === 'unpaid' && order.paymentMethod !== 'cod' && (
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-amber-900">
            <CreditCard className="h-4.5 w-4.5" /> Complete your {PAYMENT_METHOD_LABEL[order.paymentMethod]} payment
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-amber-800">
            Please send <strong>{formatPrice(order.total)}</strong> to <strong>01700-000000</strong> (Merchant)
            and use your order number <strong>{order.orderNumber}</strong> as the reference. Your order will be
            confirmed once we verify the payment.
          </p>
        </div>
      )}

      <div className="mx-auto mt-7 grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Status tracker */}
          {!cancelled && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-5 font-display text-lg font-bold text-ink-900">Order Status</h2>
              <OrderTracker
                steps={steps.map((s) => ({ key: s, label: ORDER_STATUS_LABEL[s] }))}
                current={currentIdx < 0 ? 0 : currentIdx}
              />
            </section>
          )}

          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">Items ({order.items.length})</h2>
              <span className={cn('badge border', ORDER_STATUS_COLOR[order.status])}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>
            <div className="divide-y divide-ink-100">
              {order.items.map((it) => (
                <div key={it.id} className="flex gap-3.5 p-4">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                    {it.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt={it.productName} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-ink-900">{it.productName}</p>
                    {it.variant && <p className="mt-0.5 text-[13px] text-ink-500">Size/Colour: {it.variant}</p>}
                    {it.sku && <p className="mt-0.5 text-[12px] text-ink-400">SKU: {it.sku}</p>}
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[13px] text-ink-500">{formatPrice(it.price)} × {it.qty}</span>
                      <span className="text-[15px] font-bold text-ink-900">{formatPrice(it.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          {order.timeline.length > 0 && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-ink-900">Order History</h2>
              <ol className="space-y-4">
                {order.timeline.map((ev, i) => (
                  <li key={ev.id} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', i === order.timeline.length - 1 ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-ink-300')} />
                      {i < order.timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-ink-200" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-[15px] font-semibold text-ink-900">{ORDER_STATUS_LABEL[ev.status] || ev.status}</p>
                      {ev.note && <p className="text-[13px] text-ink-500">{ev.note}</p>}
                      <p className="mt-0.5 text-[12px] text-ink-400">
                        {formatDate(ev.createdAt, 'datetime')}{ev.by ? ` · ${ev.by}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Payment summary */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-4 font-display text-base font-bold text-ink-900">Payment Summary</h2>
            <dl className="space-y-2.5 text-[15px]">
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
                <dt className="text-ink-600">Delivery</dt>
                <dd className="font-semibold text-ink-900">
                  {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-3">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-display text-xl font-bold text-ink-900">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Payment Method</span>
                <span className="font-semibold text-ink-800">{PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-500">Payment Status</span>
                <span className={cn('badge', order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Tracking</span>
                  <span className="font-mono text-[12px] font-semibold text-ink-800">{order.trackingNumber}</span>
                </div>
              )}
              {order.courier && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Courier</span>
                  <span className="font-semibold text-ink-800">{order.courier}</span>
                </div>
              )}
            </div>
          </section>

          {/* Shipping address */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-ink-900">
              <MapPin className="h-4 w-4 text-brand-600" /> Delivery Address
            </h2>
            <p className="text-[15px] font-semibold text-ink-800">{order.customerName}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
              {order.shipStreet}
              {order.shipArea ? `, ${order.shipArea}` : ''}<br />
              {order.shipDistrict}, {order.shipDivision}
              {order.shipPostcode ? ` — ${order.shipPostcode}` : ''}
            </p>
            <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-[13px]">
              <p className="flex items-center gap-2 text-ink-600">
                <Phone className="h-3.5 w-3.5 text-ink-400" /> {order.phone}
              </p>
              <p className="flex items-center gap-2 text-ink-600">
                <Mail className="h-3.5 w-3.5 text-ink-400" /> {order.email}
              </p>
            </div>
            {order.customerNote && (
              <div className="mt-3 rounded-lg bg-ink-50 p-3">
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-500">
                  <MessageSquare className="h-3 w-3" /> Note
                </p>
                <p className="mt-1 text-[13px] text-ink-600">{order.customerNote}</p>
              </div>
            )}
          </section>

          {/* Help */}
          <section className="rounded-2xl border border-ink-200 bg-ink-50/60 p-5">
            <h2 className="text-[15px] font-bold text-ink-900">Questions about your order?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
              Call us at <a href={`tel:${config.phone}`} className="font-semibold text-brand-700">{config.phone}</a> or
              email <a href={`mailto:${config.email}`} className="font-semibold text-brand-700">{config.email}</a>.
              Mention your order number <strong>{order.orderNumber}</strong>.
            </p>
            <Link href="/pages/returns" className="btn-outline btn-sm mt-3 w-full">Return Policy</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
