'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Tags, Ticket,
  Star, FileText, Newspaper, Image as ImageIcon, Settings, Store, Menu as MenuIcon,
  X, LogOut, Bell, Search, ChevronDown, ChevronRight, Truck, CreditCard,
  Globe, Palette, BarChart3, Percent, Award, Monitor, PanelLeftClose,
  PanelLeft, ExternalLink, Layers, Boxes, Megaphone, Mail, ShieldCheck, Bike,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavGroup = {
  title: string;
  items: { href: string; icon: any; label: string; badge?: number; exact?: boolean }[];
};

export default function AdminShell({
  children, user, config, badges,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
  config: { siteName: string; logo: string };
  badges: { orders: number; reviews: number; stock: number };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const groups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { href: '/admin/products', icon: Package, label: 'Products', badge: badges.stock },
        { href: '/admin/categories', icon: FolderTree, label: 'Categories' },
        { href: '/admin/brands', icon: Award, label: 'Brands' },
        { href: '/admin/inventory', icon: Boxes, label: 'Inventory' },
        { href: '/admin/reviews', icon: Star, label: 'Reviews', badge: badges.reviews },
      ],
    },
    {
      title: 'Sales',
      items: [
        { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', badge: badges.orders },
        { href: '/admin/customers', icon: Users, label: 'Customers' },
        { href: '/admin/coupons', icon: Ticket, label: 'Coupons' },
        { href: '/admin/shipping', icon: Truck, label: 'Shipping Zones' },
        { href: '/admin/payments', icon: CreditCard, label: 'Payment Methods' },
      ],
    },
    {
      title: 'Content (CMS)',
      items: [
        { href: '/admin/pages', icon: FileText, label: 'Pages' },
        { href: '/admin/posts', icon: Newspaper, label: 'Blog Posts' },
        { href: '/admin/menus', icon: Layers, label: 'Menus' },
        { href: '/admin/banners', icon: Megaphone, label: 'Banners' },
        { href: '/admin/media', icon: ImageIcon, label: 'Media Library' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { href: '/admin/settings/general', icon: Store, label: 'General' },
        { href: '/admin/settings/store', icon: Monitor, label: 'Store' },
        { href: '/admin/settings/appearance', icon: Palette, label: 'Appearance' },
        { href: '/admin/settings/seo', icon: Globe, label: 'SEO' },
        { href: '/admin/settings/checkout', icon: CreditCard, label: 'Checkout' },
        { href: '/admin/settings/payments', icon: Percent, label: 'Payment Settings' },
        { href: '/admin/settings/payment-logos', icon: CreditCard, label: 'Payment Logos' },
        { href: '/admin/settings/shipping', icon: Truck, label: 'Shipping Settings' },
        { href: '/admin/settings/courier', icon: Bike, label: 'Courier & Delivery' },
        { href: '/admin/settings/email', icon: Mail, label: 'Email & SMTP' },
        { href: '/admin/settings/sms', icon: ShieldCheck, label: 'SMS Gateway' },
        { href: '/admin/settings/social', icon: Globe, label: 'Social Media' },
        { href: '/admin/settings/analytics', icon: BarChart3, label: 'Analytics Codes' },
        { href: '/admin/settings/advanced', icon: Settings, label: 'Advanced' },
      ],
    },
    {
      title: 'System',
      items: [
        { href: '/admin/users', icon: Users, label: 'Admin Users' },
        { href: '/admin/activity', icon: ShieldCheck, label: 'Activity Log' },
      ],
    },
  ];

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  }

  const sidebar = (
    <nav className="flex h-full flex-col">
      {/* Brand — shows the uploaded logo when one is configured */}
      <div className={cn('flex h-16 shrink-0 items-center gap-2.5 border-b border-ink-100 px-4', collapsed && 'justify-center px-3')}>
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5" aria-label={`${config.siteName} admin`}>
          {config.logo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.logo}
                alt={config.siteName}
                className={cn('w-auto object-contain', collapsed ? 'max-w-[40px]' : 'max-w-[132px] h-9')}
              />
              {!collapsed && (
                <span className="flex min-w-0 flex-col leading-none">
                  <span className="text-[12px] font-bold uppercase tracking-widest text-brand-600">Admin Panel</span>
                </span>
              )}
            </>
          ) : (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Store className="h-4.5 w-4.5" strokeWidth={2.4} />
              </span>
              {!collapsed && (
                <span className="flex min-w-0 flex-col leading-none">
                  <span className="truncate font-display text-[15px] font-bold text-ink-900">{config.siteName}</span>
                  <span className="text-[12px] font-bold uppercase tracking-widest text-brand-600">Admin Panel</span>
                </span>
              )}
            </>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {groups.map((g) => (
          <div key={g.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[12px] font-bold uppercase tracking-[.14em] text-ink-400">{g.title}</p>
            )}
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    title={collapsed ? it.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all',
                      active
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <it.icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-ink-400 group-hover:text-ink-700')} />
                    {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                    {!collapsed && !!it.badge && it.badge > 0 && (
                      <span className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] font-bold',
                        active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                      )}>
                        {it.badge > 99 ? '99+' : it.badge}
                      </span>
                    )}
                    {collapsed && !!it.badge && it.badge > 0 && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-ink-100 p-2.5">
        <Link
          href="/"
          target="_blank"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-600 transition hover:bg-ink-100',
            collapsed && 'justify-center px-2'
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-ink-400" />
          {!collapsed && 'View Storefront'}
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-ink-200 bg-white transition-all duration-300 lg:block',
          collapsed ? 'w-[68px]' : 'w-[248px]'
        )}
      >
        {sidebar}
      </aside>

      {/* ── Mobile sidebar ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[268px] bg-white shadow-pop">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-[68px]' : 'lg:pl-[248px]')}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-lg p-2 text-ink-500 hover:bg-ink-100 lg:block"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>

            {/* Search */}
            <form action="/admin/products" className="relative hidden max-w-sm flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                name="q"
                placeholder="Search products, orders, customers…"
                className="input py-2 pl-9 text-[13px]"
                aria-label="Admin search"
              />
            </form>

            <div className="ml-auto flex items-center gap-1.5">
              <Link
                href="/admin/orders?status=PENDING"
                className="relative rounded-lg p-2.5 text-ink-600 transition hover:bg-ink-100"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {badges.orders + badges.reviews > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[12px] font-bold text-white">
                    {badges.orders + badges.reviews > 9 ? '9+' : badges.orders + badges.reviews}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-ink-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[13px] font-bold text-brand-700">
                    {user.name.charAt(0)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-[13px] font-bold leading-tight text-ink-900">{user.name}</span>
                    <span className="block text-[12px] font-semibold uppercase tracking-wide text-ink-400">{user.role}</span>
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-ink-400 sm:block" />
                </button>

                {userMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 w-60 animate-fade-in rounded-2xl border border-ink-200 bg-white p-2 shadow-pop">
                      <div className="border-b border-ink-100 px-3 py-2.5">
                        <p className="text-[15px] font-bold text-ink-900">{user.name}</p>
                        <p className="truncate text-[12px] text-ink-500">{user.email}</p>
                        <span className="mt-1.5 inline-block rounded bg-brand-50 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-brand-700">
                          {user.role}
                        </span>
                      </div>
                      <Link href="/admin/settings/general" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-ink-50">
                        <Settings className="h-4 w-4 text-ink-400" /> Store Settings
                      </Link>
                      <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-ink-50">
                        <ExternalLink className="h-4 w-4 text-ink-400" /> View Storefront
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <Breadcrumbs pathname={pathname} />
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length <= 1) return null;

  return (
    <div className="flex h-9 items-center gap-1.5 border-t border-ink-100 px-4 text-[12px] text-ink-500 sm:px-6">
      <Link href="/admin" className="hover:text-brand-700">Admin</Link>
      {parts.slice(1).map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-ink-300" />
          <span className={i === parts.length - 2 ? 'font-semibold capitalize text-ink-800' : 'capitalize'}>
            {p.replace(/-/g, ' ')}
          </span>
        </span>
      ))}
    </div>
  );
}
