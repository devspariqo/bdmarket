import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page Not Found', robots: { index: false, follow: false } };

export default function NotFound() {
  const links = [
    { href: '/shop', label: 'Shop All Products' },
    { href: '/category/saree', label: 'Saree Collection' },
    { href: '/category/panjabi', label: 'Panjabi Collection' },
    { href: '/track', label: 'Track My Order' },
    { href: '/pages/contact', label: 'Contact Support' },
  ];

  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[80px] font-bold leading-none text-ink-200 sm:text-[120px]">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink-900 sm:text-3xl">Page not found</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="chip">{l.label}</Link>
        ))}
      </div>

      <Link href="/" className="btn-primary btn-lg mt-8">Back to Home</Link>
    </div>
  );
}
