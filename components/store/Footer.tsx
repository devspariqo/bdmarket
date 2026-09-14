import Link from 'next/link';
import {
  Facebook, Instagram, Youtube, Twitter, Linkedin, Phone, Mail, MapPin,
  Truck, ShieldCheck, RotateCcw, Headphones, CreditCard, Store,
} from 'lucide-react';
import { PaymentBadge } from '@/components/PaymentMark';
import type { PaymentLogo } from '@/lib/payment-logos';

type MenuItem = { label: string; href: string };

export default function Footer({
  config, footerMenus, paymentLogos = [],
}: {
  config: any;
  footerMenus: { 'footer-1'?: MenuItem[]; 'footer-2'?: MenuItem[]; 'footer-3'?: MenuItem[] };
  paymentLogos?: PaymentLogo[];
}) {
  const year = new Date().getFullYear();

  // The grid is 3 columns, so nine methods fill it exactly. Extra methods flow
  // onto a fourth row rather than being dropped.
  const payments = paymentLogos.slice(0, 12);

  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-900 text-ink-300">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {[
            { icon: Truck, title: 'Nationwide Delivery', desc: 'All 64 districts, 1–7 days' },
            { icon: CreditCard, title: 'Cash on Delivery', desc: 'bKash, Nagad & Card accepted' },
            { icon: RotateCcw, title: '7-Day Returns', desc: 'Easy return & refund policy' },
            { icon: Headphones, title: 'Support 9AM–9PM', desc: 'Hotline & WhatsApp support' },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-semibold text-white">{f.title}</p>
                <p className="text-[13px] text-ink-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="container-x grid gap-10 py-12 lg:grid-cols-12">
        {/* Brand */}
        <div className="lg:col-span-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label={config.siteName}>
            {config.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo}
                alt={config.siteName}
                className="h-11 w-auto max-w-[180px] object-contain"
              />
            ) : (
              <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Store className="h-5 w-5" strokeWidth={2.4} />
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-display text-xl font-bold text-white">{config.siteName}</span>
                  <span className="bn text-[12px] text-ink-400">{config.siteNameBn}</span>
                </span>
              </>
            )}
          </Link>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-ink-400">
            {config.siteName} brings authentic Bangladeshi fashion and lifestyle products to your
            doorstep — from handwoven Jamdani sarees to festive panjabi and handcrafted leather goods.
            Cash on delivery available across all 64 districts.
          </p>

          <div className="mt-5 space-y-2.5 text-[15px]">
            <p className="flex items-start gap-2.5 text-ink-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>{config.address}</span>
            </p>
            <a href={`tel:${config.phone}`} className="flex items-center gap-2.5 text-ink-400 transition hover:text-white">
              <Phone className="h-4 w-4 shrink-0 text-brand-400" /> {config.phone}
            </a>
            <a href={`mailto:${config.email}`} className="flex items-center gap-2.5 text-ink-400 transition hover:text-white">
              <Mail className="h-4 w-4 shrink-0 text-brand-400" /> {config.email}
            </a>
          </div>

          <div className="mt-5 flex items-center gap-2">
            {[
              { href: config.social.facebook, icon: Facebook, label: 'Facebook' },
              { href: config.social.instagram, icon: Instagram, label: 'Instagram' },
              { href: config.social.youtube, icon: Youtube, label: 'YouTube' },
              { href: config.social.twitter, icon: Twitter, label: 'X' },
              { href: config.social.linkedin, icon: Linkedin, label: 'LinkedIn' },
            ]
              .filter((s) => s.href)
              .map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-ink-300 transition hover:bg-brand-600 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="lg:col-span-2">
          <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-white">Shop</h4>
          <ul className="space-y-2.5 text-[15px]">
            {(footerMenus['footer-2'] || []).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-400 transition hover:text-brand-300">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-white">Support</h4>
          <ul className="space-y-2.5 text-[15px]">
            {(footerMenus['footer-1'] || []).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-400 transition hover:text-brand-300">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="lg:col-span-4">
          <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-white">Stay in the Loop</h4>
          <p className="text-[15px] text-ink-400">
            Get early access to Eid collections, new arrivals and exclusive discounts.
          </p>
          <form action="/api/newsletter" method="POST" className="mt-4 flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-[15px] text-white placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button type="submit" className="btn bg-brand-600 px-4 text-white hover:bg-brand-500">
              Subscribe
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-500">Accepted Payments</p>
            {payments.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2.5">
                {payments.map((m) => (
                  <li
                    key={m.id}
                    title={m.note ? `${m.label} — ${m.note}` : m.label}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white px-1.5 py-3 transition hover:border-white/25"
                  >
                    <span className="flex h-8 items-center justify-center">
                      <PaymentBadge method={m} />
                    </span>
                    <span className="w-full truncate text-center text-[11px] font-semibold leading-tight text-ink-600">
                      {m.label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink-500">
                Payment methods are configured in the admin panel.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-[13px] text-ink-500 sm:flex-row">
          <p>
            © {year} {config.siteName}. All rights reserved. Made in Bangladesh 🇧🇩
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {(footerMenus['footer-3'] || []).map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-brand-300">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
