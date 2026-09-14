'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function SortSelect({ current, base }: { current: string; base: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    { v: 'featured', l: 'Featured' },
    { v: 'newest', l: 'Newest First' },
    { v: 'price-asc', l: 'Price: Low to High' },
    { v: 'price-desc', l: 'Price: High to Low' },
    { v: 'popular', l: 'Most Popular' },
    { v: 'rating', l: 'Top Rated' },
  ];

  function change(v: string) {
    const sp = new URLSearchParams(base);
    sp.set('sort', v);
    sp.delete('page');
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <select
      id="sort"
      value={current}
      onChange={(e) => change(e.target.value)}
      className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-ink-700 focus:border-brand-500 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.v} value={o.v}>{o.l}</option>
      ))}
    </select>
  );
}
