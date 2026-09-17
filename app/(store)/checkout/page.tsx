import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { getCartWithTotals } from '@/lib/cart';
import { getSiteConfig, getCheckoutFields } from '@/lib/settings';
import { getCustomerSession } from '@/lib/auth';
import prisma from '@/lib/db';
import CheckoutClient from '@/components/store/CheckoutClient';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Complete your order with Cash on Delivery, bKash, Nagad or card payment.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const [data, config, session, checkoutFields] = await Promise.all([
    getCartWithTotals(),
    getSiteConfig(),
    getCustomerSession(),
    // Shares the same settings read as getSiteConfig() — getAllSettings now
    // de-duplicates concurrent callers, so this costs no extra query.
    getCheckoutFields(),
  ]);

  if (!data.items.length) redirect('/cart');

  const [paymentMethods, zones] = await Promise.all([
    prisma.paymentMethod.findMany({ where: { isEnabled: true }, orderBy: { position: 'asc' } }),
    prisma.shippingZone.findMany({ where: { status: 'active' }, orderBy: { position: 'asc' } }),
  ]);

  let customer = null;
  let savedAddress = null;
  if (session) {
    customer = await prisma.customer.findUnique({ where: { id: session.id } });
    savedAddress = await prisma.address.findFirst({
      where: { customerId: session.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  return (
    <div className="container-x py-8">
      <nav className="mb-6 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
        <Link href="/cart" className="hover:text-brand-700">Cart</Link> <span>/</span>{' '}
        <span className="font-semibold text-ink-800">Checkout</span>
      </nav>

      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Checkout</h1>
        <p className="mt-1.5 text-[15px] text-ink-500">
          {config.guestCheckout
            ? 'No account needed — order as a guest and pay cash on delivery.'
            : 'Please sign in to complete your order.'}
        </p>
      </div>

      <CheckoutClient
        items={data.items}
        summary={{ subtotal: data.subtotal, discount: data.discount, shipping: data.shipping, total: data.total, coupon: data.coupon }}
        paymentMethods={paymentMethods.map((p) => ({
          code: p.code, name: p.name, nameBn: p.nameBn, description: p.description,
          icon: p.icon, instructions: p.instructions, fee: p.fee, isSandbox: p.isSandbox,
        }))}
        zones={zones.map((z) => ({ name: z.name, districts: z.districts, rate: z.rate, freeOver: z.freeOver, minDays: z.minDays, maxDays: z.maxDays }))}
        customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone || '' } : null}
        savedAddress={savedAddress ? {
          division: savedAddress.division, district: savedAddress.district,
          area: savedAddress.area || '', street: savedAddress.street, postcode: savedAddress.postcode || '',
        } : null}
        freeShippingOver={config.freeShippingOver}
        guestCheckout={config.guestCheckout}
        fields={checkoutFields}
      />
    </div>
  );
}
