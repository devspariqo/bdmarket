import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { getCartWithTotals } from '@/lib/cart';
import { getSiteConfig } from '@/lib/settings';
import { formatPrice } from '@/lib/utils';
import CartClient from '@/components/store/CartClient';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review items in your shopping cart and proceed to secure checkout.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const [data, config] = await Promise.all([getCartWithTotals(), getSiteConfig()]);

  if (!data.items.length) {
    return (
      <div className="container-x py-20 text-center">
        <span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
          <ShoppingBag className="h-9 w-9 text-ink-400" />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Your cart is empty</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-500">
          Looks like you haven't added anything yet. Explore our collections and find something you love.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn-primary btn-lg">Start Shopping <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/category/saree" className="btn-outline btn-lg">Browse Sarees</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <nav className="mb-6 text-[13px] text-ink-500">
        <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
        <span className="font-semibold text-ink-800">Cart</span>
      </nav>

      <h1 className="mb-7 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        Shopping Cart
        <span className="ml-2 text-base font-normal text-ink-500">({data.count} {data.count === 1 ? 'item' : 'items'})</span>
      </h1>

      <CartClient
        items={data.items}
        subtotal={data.subtotal}
        discount={data.discount}
        shipping={data.shipping}
        total={data.total}
        coupon={data.coupon}
        freeShippingOver={config.freeShippingOver}
      />
    </div>
  );
}
