'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag, Search, Menu, X, Heart, User, Phone, ChevronDown,
  MapPin, Truck, Facebook, Instagram, Youtube, Store, MessageCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type NavItem = { label: string; labelBn?: string; href: string; children?: NavItem[] };

export default function Header({
  nav, config, cartCount = 0, customer,
}: {
  nav: NavItem[];
  config: any;
  cartCount?: number;
  customer?: { name: string } | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openMobileSub, setOpenMobileSub] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setOpenMobileSub(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      {/* Announcement bar.
          Mobile: one copy is tiled across the track and animated, so the text is never
          clipped. The duplicate copy is `aria-hidden` and positioned off-track — it only
          exists to make the loop seamless. Both live in a `w-max` flex row that is wider
          than the viewport, which is what keeps the second copy out of sight at rest. */}
      {config.appearance.showAnnouncement && (
        <div className="overflow-hidden bg-brand-600 text-white">
          <div className="flex h-9 items-center">
            {/* Mobile marquee */}
            <div className="flex w-max animate-marquee-loop sm:hidden">
              {[0, 1].map((i) => (
                <p
                  key={i}
                  aria-hidden={i === 1 ? 'true' : undefined}
                  className="bn shrink-0 whitespace-nowrap px-8 text-[12px] font-medium tracking-wide"
                >
                  {config.appearance.announcementText}
                </p>
              ))}
            </div>
            {/* Desktop — single centred line */}
            <p className="bn mx-auto hidden truncate px-4 text-center text-[13px] font-medium tracking-wide sm:block">
              {config.appearance.announcementText}
            </p>
          </div>
        </div>
      )}

      {/* Utility strip — desktop */}
      <div className="hidden border-b border-ink-100 bg-ink-50/70 lg:block">
        <div className="container-x flex h-9 items-center justify-between text-[12px] text-ink-600">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3 w-3" /> {config.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3 w-3" /> Free delivery over ৳{config.freeShippingOver}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/track" className="hover:text-brand-700">Track Order</Link>
            <Link href="/pages/faq" className="hover:text-brand-700">Help</Link>
            <span className="h-3 w-px bg-ink-200" />
            <a href={config.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-brand-700">
              <Facebook className="h-3.5 w-3.5" />
            </a>
            <a href={config.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-brand-700">
              <Instagram className="h-3.5 w-3.5" />
            </a>
            <a href={config.social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-brand-700">
              <Youtube className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur transition-shadow duration-300 ${
          scrolled ? 'border-ink-200 shadow-sm' : 'border-transparent'
        }`}
      >
        <div className="container-x flex h-14 items-center gap-2 sm:h-16 lg:h-[72px] lg:gap-6">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen(true)}
            className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-100 active:bg-ink-200 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo — when an image is configured it replaces the wordmark entirely */}
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label={config.siteName}>
            {config.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo}
                alt={config.siteName}
                className="h-8 w-auto max-w-[132px] object-contain sm:h-9 sm:max-w-[170px] lg:h-10 lg:max-w-[190px]"
              />
            ) : (
              <>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Store className="h-4.5 w-4.5" strokeWidth={2.4} />
                </span>
                <span className="hidden min-w-0 flex-col leading-none xs:flex">
                  <span className="truncate font-display text-lg font-bold tracking-tight text-ink-900">
                    {config.siteName}
                  </span>
                  <span className="bn truncate text-[12px] font-medium text-ink-500">{config.siteNameBn}</span>
                </span>
              </>
            )}
          </Link>

          {/* Desktop search */}
          <form onSubmit={submitSearch} role="search" className="relative hidden max-w-md flex-1 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search panjabi, saree, kurti…"
              className="input py-2.5 pl-10 pr-4"
              aria-label="Search products"
            />
          </form>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:gap-2">
            <button
              onClick={() => router.push('/search')}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-100 active:bg-ink-200 lg:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <Link
              href={customer ? '/account/wishlist' : '/login'}
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-100 sm:flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            <Link
              href={customer ? '/account' : '/login'}
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-ink-700 transition hover:bg-ink-100 sm:flex"
            >
              <User className="h-5 w-5" />
              <span className="hidden text-[13px] font-semibold lg:inline">
                {customer ? customer.name.split(' ')[0] : 'Login'}
              </span>
            </Link>

            <Link
              href="/cart"
              className="relative flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-3 text-white transition hover:bg-brand-700 active:bg-brand-800 lg:px-4"
              aria-label="Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="hidden text-[13px] font-semibold lg:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[12px] font-bold text-accent-on ring-2 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search — always visible so phones get search without hunting for the icon */}
        <div className="container-x pb-2.5 pt-0.5 lg:hidden">
          <form onSubmit={submitSearch} role="search" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search panjabi, saree, kurti…"
              className="input py-2 pl-9 pr-4 text-[13px]"
              aria-label="Search products"
            />
          </form>
        </div>

        {/* Desktop nav */}
        <nav className="hidden border-t border-ink-100 lg:block">
          <div className="container-x flex h-11 items-center gap-1">
            {nav.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.href)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
                    pathname === item.href ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900'
                  }`}
                >
                  {item.label}
                  {item.children && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </Link>

                {item.children && openMenu === item.href && (
                  <div className="absolute left-0 top-full z-50 w-60 animate-fade-in pt-1">
                    <div className="rounded-2xl border border-ink-200 bg-white p-2 shadow-pop">
                      {item.children.map((ch) => (
                        <Link
                          key={ch.href}
                          href={ch.href}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700"
                        >
                          <span>{ch.label}</span>
                          {ch.labelBn && <span className="bn text-[12px] text-ink-400">{ch.labelBn}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/shop?sale=1"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[12px] font-bold text-accent-on transition hover:bg-accent-hover"
            >
              🔥 Sale
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-pop animate-[fade-up_.25s_ease]">
            <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
              {config.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.logo} alt={config.siteName} className="h-8 w-auto max-w-[150px] object-contain" />
              ) : (
                <span className="font-display text-lg font-bold">{config.siteName}</span>
              )}
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-700 transition hover:bg-ink-100 active:bg-ink-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search inside the drawer — thumb-reachable */}
            <div className="border-b border-ink-100 px-3 py-2.5">
              <form onSubmit={submitSearch} role="search" className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="input py-2.5 pl-9 pr-4 text-[13px]"
                  aria-label="Search products"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              {nav.map((item) => (
                <div key={item.href}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => setOpenMobileSub(openMobileSub === item.href ? null : item.href)}
                        aria-expanded={openMobileSub === item.href}
                        className="flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-semibold text-ink-800 transition hover:bg-ink-50 active:bg-ink-100"
                      >
                        <span className="flex items-center gap-2">
                          {item.label}
                          {item.labelBn && <span className="bn text-[12px] font-normal text-ink-400">{item.labelBn}</span>}
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition ${openMobileSub === item.href ? 'rotate-180' : ''}`} />
                      </button>
                      {openMobileSub === item.href && (
                        <div className="ml-3 border-l-2 border-brand-100 pl-2">
                          <Link href={item.href} className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-[13px] font-medium text-brand-700">
                            View all {item.label}
                          </Link>
                          {item.children.map((ch) => (
                            <Link key={ch.href} href={ch.href} className="flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-[13px] text-ink-600 transition hover:bg-ink-50 active:bg-ink-100">
                              <span>{ch.label}</span>
                              {ch.labelBn && <span className="bn text-[12px] text-ink-400">{ch.labelBn}</span>}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} className="flex min-h-[48px] items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold text-ink-800 transition hover:bg-ink-50 active:bg-ink-100">
                      <span>{item.label}</span>
                      {item.labelBn && <span className="bn text-[12px] font-normal text-ink-400">{item.labelBn}</span>}
                    </Link>
                  )}
                </div>
              ))}

              <div className="mt-4 border-t border-ink-100 pt-4">
                <Link href={customer ? '/account' : '/login'} className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-ink-800 transition hover:bg-ink-50 active:bg-ink-100">
                  <User className="h-4 w-4" /> {customer ? 'My Account' : 'Login / Register'}
                </Link>
                <Link href={customer ? '/account/wishlist' : '/login'} className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-ink-800 transition hover:bg-ink-50 active:bg-ink-100">
                  <Heart className="h-4 w-4" /> Wishlist
                </Link>
                <Link href="/track" className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-ink-800 transition hover:bg-ink-50 active:bg-ink-100">
                  <MapPin className="h-4 w-4" /> Track Order
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-ink-100 p-3 safe-bottom">
              <a href={`tel:${config.phone}`} className="btn-bd h-11 text-[13px]">
                <Phone className="h-4 w-4" /> Call
              </a>
              <a
                href={`https://wa.me/${String(config.whatsapp).replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn h-11 bg-[#25D366] text-[13px] text-white hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
