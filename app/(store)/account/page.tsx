import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';
import { formatPrice, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, cn } from '@/lib/utils';
import AccountSidebar from '@/components/store/AccountSidebar';
import { Package, Heart, MapPin, Wallet, ArrowRight, User } from 'lucide-react';

export const metadata: Metadata = { title: 'My Account', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect('/login?redirect=/account');

  const customer = await prisma.customer.findUnique({ where: { id: session.id } });
  if (!customer) redirect('/login');

  const [orders, addressCount, wishlistCount] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: { take: 3 } },
    }),
    prisma.address.count({ where: { customerId: customer.id } }),
    prisma.wishlist.count({ where: { customerId: customer.id } }),
  ]);

  const totalOrders = await prisma.order.count({ where: { customerId: customer.id } });
  const spent = await prisma.order.aggregate({
    where: { customerId: customer.id, status: { in: ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] } },
    _sum: { total: true },
  });

  return (
    <div className="container-x py-8">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          My Account
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">Welcome back, {customer.name.split(' ')[0]}!</p>
      </div>

      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <AccountSidebar active="dashboard" name={customer.name} avatar={customer.avatar} />

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              { icon: Package, label: 'Total Orders', value: totalOrders, href: '/account/orders', color: 'bg-blue-50 text-blue-700' },
              { icon: Wallet, label: 'Total Spent', value: formatPrice(spent._sum.total || 0), href: '/account/orders', color: 'bg-emerald-50 text-emerald-700' },
              { icon: Heart, label: 'Wishlist', value: wishlistCount, href: '/account/wishlist', color: 'bg-rose-50 text-rose-700' },
              { icon: MapPin, label: 'Addresses', value: addressCount, href: '/account/addresses', color: 'bg-amber-50 text-amber-700' },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="rounded-2xl border border-ink-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <span className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-xl', s.color)}>
                  <s.icon className="h-4.5 w-4.5" />
                </span>
                <p className="font-display text-xl font-bold text-ink-900">{s.value}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-ink-500">{s.label}</p>
              </Link>
            ))}
          </div>

          {/* Profile */}
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <User className="h-4.5 w-4.5 text-brand-600" /> Profile Details
              </h2>
              <Link href="/account/profile" className="text-[13px] font-semibold text-brand-700 hover:underline">Edit</Link>
            </div>
            <dl className="grid gap-3.5 sm:grid-cols-2">
              {[
                ['Full Name', customer.name],
                ['Email', customer.email],
                ['Mobile', customer.phone || '—'],
                ['District', customer.district || '—'],
                ['Customer Since', formatDate(customer.createdAt, 'long')],
                ['Marketing Emails', customer.acceptsMarketing ? 'Subscribed' : 'Not subscribed'],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12px] font-bold uppercase tracking-wider text-ink-400">{k}</dt>
                  <dd className="mt-0.5 text-[15px] font-medium text-ink-800">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Recent orders */}
          <section className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">Recent Orders</h2>
              <Link href="/account/orders" className="text-[13px] font-semibold text-brand-700 hover:underline">View all →</Link>
            </div>

            {orders.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Package className="mx-auto mb-3 h-9 w-9 text-ink-300" />
                <p className="text-[15px] font-semibold text-ink-700">No orders yet</p>
                <p className="mt-1 text-[13px] text-ink-500">Your order history will appear here.</p>
                <Link href="/shop" className="btn-primary btn-sm mt-4">Start Shopping</Link>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {orders.map((o) => (
                  <Link key={o.id} href={`/order/${o.orderNumber}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-ink-50/60">
                    <div className="flex -space-x-2">
                      {o.items.map((it) => (
                        <div key={it.id} className="h-11 w-9 overflow-hidden rounded-lg border-2 border-white bg-ink-100">
                          {it.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.image} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] font-bold text-ink-900">{o.orderNumber}</p>
                      <p className="mt-0.5 text-[12px] text-ink-500">
                        {formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-ink-900">{formatPrice(o.total)}</p>
                      <span className={cn('badge mt-1 border', ORDER_STATUS_COLOR[o.status])}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-300 sm:block" />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
