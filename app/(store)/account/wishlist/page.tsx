import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';
import AccountSidebar from '@/components/store/AccountSidebar';
import ProductCard from '@/components/store/ProductCard';
import { Heart } from 'lucide-react';

export const metadata: Metadata = { title: 'My Wishlist', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const session = await getCustomerSession();
  if (!session) redirect('/login?redirect=/account/wishlist');

  const items = await prisma.wishlist.findMany({
    where: { customerId: session.id },
    include: {
      product: {
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container-x py-8">
      <h1 className="mb-7 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">My Wishlist</h1>

      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <AccountSidebar active="wishlist" name={session.name} />

        <div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-20 text-center">
              <Heart className="mx-auto mb-4 h-10 w-10 text-ink-300" />
              <h2 className="text-lg font-bold text-ink-800">Your wishlist is empty</h2>
              <p className="mt-2 text-[15px] text-ink-500">Save products you love and find them here later.</p>
              <Link href="/shop" className="btn-primary mt-5">Browse Products</Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[15px] text-ink-500">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {items.map((w) => (
                  <ProductCard key={w.id} product={w.product} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
