'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Heart, MapPin, User, LogOut, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/account', key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/account/orders', key: 'orders', icon: Package, label: 'My Orders' },
  { href: '/account/wishlist', key: 'wishlist', icon: Heart, label: 'Wishlist' },
  { href: '/account/addresses', key: 'addresses', icon: MapPin, label: 'Addresses' },
  { href: '/account/profile', key: 'profile', icon: User, label: 'Profile' },
];

export default function AccountSidebar({ active, name }: { active: string; name: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/customer/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-32 hidden h-fit lg:block">
        <div className="rounded-2xl border border-ink-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-3 border-b border-ink-100 px-2 pb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-[15px] font-bold text-brand-700">
              {name.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-ink-900">{name}</p>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">Customer</p>
            </div>
          </div>
          <nav className="space-y-0.5">
            {links.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition',
                  active === l.key ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                )}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </nav>
        </div>
      </aside>

      {/* Mobile horizontal */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={cn('chip shrink-0', active === l.key && 'chip-active')}
            >
              <l.icon className="h-3.5 w-3.5" /> {l.label}
            </Link>
          ))}
          <button onClick={logout} className="chip shrink-0 border-rose-200 text-rose-600">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
