import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';
import AccountSidebar from '@/components/store/AccountSidebar';
import { formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_METHOD_LABEL, cn } from '@/lib/utils';
import { Package, ArrowRight } from 'lucide-react';

export const metadata: Metadata = { title: 'My Orders', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountOrdersPage() {
  const session = await getCustomerSession();
  if (!session) redirect('/login?redirect=/account/orders');

  const orders = await prisma.order.findMany({
    where: { customerId: session.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return (
    <div className="container-x py-8">
      <h1 className="mb-7 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">My Orders</h1>

      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <AccountSidebar active="orders" name={session.name} />

        <div>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-20 text-center">
              <Package className="mx-auto mb-4 h-10 w-10 text-ink-300" />
              <h2 className="text-lg font-bold text-ink-800">No orders yet</h2>
              <p className="mt-2 text-[15px] text-ink-500">When you place an order it will appear here.</p>
              <Link href="/shop" className="btn-primary mt-5">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 bg-ink-50/60 px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Order</p>
                        <p className="font-mono text-[13px] font-bold text-ink-900">{o.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Placed</p>
                        <p className="text-[13px] font-semibold text-ink-800">{formatDate(o.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Total</p>
                        <p className="text-[13px] font-bold text-ink-900">{formatPrice(o.total)}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Payment</p>
                        <p className="text-[13px] font-semibold text-ink-800">
                          {PAYMENT_METHOD_LABEL[o.paymentMethod] || o.paymentMethod}
                          <span className={cn('ml-1.5 badge', o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                            {o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className={cn('badge border', ORDER_STATUS_COLOR[o.status])}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-ink-100">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-3.5 px-5 py-3.5">
                        <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                          {it.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt={it.productName} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-[15px] font-semibold text-ink-900">{it.productName}</p>
                          {it.variant && <p className="mt-0.5 text-[12px] text-ink-500">{it.variant}</p>}
                          <p className="mt-0.5 text-[12px] text-ink-500">{formatPrice(it.price)} × {it.qty}</p>
                        </div>
                        <span className="text-[15px] font-bold text-ink-900">{formatPrice(it.total)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/40 px-5 py-3.5">
                    <p className="text-[12px] text-ink-500">
                      {o.trackingNumber ? (
                        <>Tracking: <span className="font-mono font-semibold text-ink-700">{o.trackingNumber}</span>
                          {o.courier && ` · ${o.courier}`}</>
                      ) : (
                        'Tracking information will appear once shipped'
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/order/${o.orderNumber}`} className="btn-outline btn-sm">
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link href="/pages/returns" className="btn-ghost btn-sm">Return</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
