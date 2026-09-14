'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, Heart, User } from 'lucide-react';

export default function MobileBottomNav({
  cartCount = 0, customer,
}: { cartCount?: number; customer?: { name: string } | null }) {
  const pathname = usePathname();

  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/shop', icon: LayoutGrid, label: 'Shop' },
    { href: '/cart', icon: ShoppingBag, label: 'Cart', badge: cartCount },
    { href: customer ? '/account/wishlist' : '/login', icon: Heart, label: 'Wishlist' },
    { href: customer ? '/account' : '/login', icon: User, label: customer ? 'Account' : 'Login' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-200 bg-white/98 backdrop-blur-md safe-bottom lg:hidden"
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {items.map((it) => {
          // `/` must match exactly, otherwise every route counts as "home".
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          return (
            <Link
              key={it.label}
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-2 transition active:bg-ink-50 ${
                active ? 'text-brand-700' : 'text-ink-500'
              }`}
            >
              <span className="relative">
                <it.icon className={`h-[22px] w-[22px] ${active ? 'stroke-[2.4]' : ''}`} />
                {!!it.badge && it.badge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[12px] font-bold text-accent-on ring-2 ring-white">
                    {it.badge > 9 ? '9+' : it.badge}
                  </span>
                )}
              </span>
              <span className="text-[12px] font-semibold leading-none">{it.label}</span>
              {active && <span className="absolute top-0 h-0.5 w-9 rounded-full bg-brand-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
