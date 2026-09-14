'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { SIZE_OPTIONS, cn } from '@/lib/utils';

type Cat = { id: string; name: string; slug: string; count: number; parent: string | null };
type Brand = { id: string; name: string; slug: string };

export default function ShopFilters({
  categories, brands, current, priceRange,
}: {
  categories: Cat[];
  brands: Brand[];
  current: {
    category: string[]; brand: string[]; size: string[];
    min?: number; max?: number; sale: boolean; stock: boolean; sort: string; q: string;
  };
  priceRange: { min: number; max: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minP, setMinP] = useState(current.min || priceRange.min);
  const [maxP, setMaxP] = useState(current.max || priceRange.max);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    category: true, price: true, size: true, brand: false, other: true,
  });

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function update(key: string, value?: string, mode: 'toggle' | 'set' | 'remove' = 'toggle') {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('page');

    if (mode === 'set') {
      if (value) sp.set(key, value); else sp.delete(key);
    } else {
      const cur = (sp.get(key) || '').split(',').filter(Boolean);
      const idx = cur.indexOf(value || '');
      if (idx >= 0) cur.splice(idx, 1); else cur.push(value || '');
      if (cur.length) sp.set(key, cur.join(',')); else sp.delete(key);
    }
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function setRange() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('page');
    sp.set('min', String(minP));
    sp.set('max', String(maxP));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const activeCount =
    current.category.length + current.brand.length + current.size.length +
    (current.sale ? 1 : 0) + (current.stock ? 1 : 0) +
    (current.min || current.max ? 1 : 0);

  const topCats = categories.filter((c) => !c.parent);
  const childCats = categories.filter((c) => c.parent);

  const panel = (
    <div className="space-y-1">
      {/* Category */}
      <Section title="Category" open={openSections.category} onToggle={() => setOpenSections((s) => ({ ...s, category: !s.category }))}>
        <div className="space-y-0.5">
          {topCats.map((c) => {
            const kids = childCats.filter((k) => k.parent === c.name);
            const isOpen = !!kids.length;
            return (
              <div key={c.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={current.category.includes(c.slug)}
                    onChange={() => update('category', c.slug)}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="flex-1 text-[13px] font-semibold text-ink-800">{c.name}</span>
                  <span className="text-[12px] text-ink-400">{c.count}</span>
                </label>
                {isOpen && (
                  <div className="ml-4 border-l border-ink-200 pl-1">
                    {kids.map((k) => (
                      <label key={k.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-ink-50">
                        <input
                          type="checkbox"
                          checked={current.category.includes(k.slug)}
                          onChange={() => update('category', k.slug)}
                          className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="flex-1 text-[13px] text-ink-600">{k.name}</span>
                        <span className="text-[12px] text-ink-400">{k.count}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Price */}
      <Section title="Price Range" open={openSections.price} onToggle={() => setOpenSections((s) => ({ ...s, price: !s.price }))}>
        <div className="space-y-3 px-1">
          <div className="flex items-center gap-2">
            <input
              type="number" value={minP} onChange={(e) => setMinP(Number(e.target.value))}
              className="input px-2 py-1.5 text-[13px]" placeholder="Min" aria-label="Minimum price"
            />
            <span className="text-ink-400">–</span>
            <input
              type="number" value={maxP} onChange={(e) => setMaxP(Number(e.target.value))}
              className="input px-2 py-1.5 text-[13px]" placeholder="Max" aria-label="Maximum price"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[[0, 1000], [1000, 2500], [2500, 5000], [5000, 10000]].map(([a, b]) => (
              <button
                key={`${a}-${b}`}
                onClick={() => { setMinP(a); setMaxP(b); }}
                className={cn('chip px-2.5 py-1 text-[12px]', current.min === a && current.max === b && 'chip-active')}
              >
                ৳{a}–{b >= 10000 ? '10k+' : b}
              </button>
            ))}
          </div>
          <button onClick={setRange} className="btn-dark btn-sm w-full">Apply Price</button>
        </div>
      </Section>

      {/* Size */}
      <Section title="Size" open={openSections.size} onToggle={() => setOpenSections((s) => ({ ...s, size: !s.size }))}>
        <div className="flex flex-wrap gap-1.5 px-1">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => update('size', s)}
              className={cn('chip px-3 py-1.5 text-[12px]', current.size.includes(s) && 'chip-active')}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      {/* Brand */}
      <Section title="Brand" open={openSections.brand} onToggle={() => setOpenSections((s) => ({ ...s, brand: !s.brand }))}>
        <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1">
          {brands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-ink-50">
              <input
                type="checkbox"
                checked={current.brand.includes(b.slug)}
                onChange={() => update('brand', b.slug)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-[13px] text-ink-700">{b.name}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Other */}
      <Section title="Availability" open={openSections.other} onToggle={() => setOpenSections((s) => ({ ...s, other: !s.other }))}>
        <div className="space-y-0.5">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-ink-50">
            <input
              type="checkbox" checked={current.stock}
              onChange={(e) => update('stock', e.target.checked ? '1' : undefined, 'set')}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[13px] text-ink-700">In Stock Only</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-ink-50">
            <input
              type="checkbox" checked={current.sale}
              onChange={(e) => update('sale', e.target.checked ? '1' : undefined, 'set')}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[13px] text-ink-700">On Sale</span>
          </label>
        </div>
      </Section>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="btn-outline w-full justify-between"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[12px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white animate-[fade-up_.25s_ease]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3.5">
                <h3 className="font-bold">Filters {activeCount > 0 && `(${activeCount})`}</h3>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-ink-100" aria-label="Close filters">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">{panel}</div>
              <div className="sticky bottom-0 border-t border-ink-100 bg-white p-4 safe-bottom">
                <button onClick={() => setMobileOpen(false)} className="btn-primary w-full">
                  Show results
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="sticky top-32 hidden h-fit max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl border border-ink-200 bg-white p-4 lg:block">
        <div className="mb-3 flex items-center justify-between border-b border-ink-100 pb-3">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink-900">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </h3>
          {activeCount > 0 && (
            <button onClick={() => router.push('/shop')} className="text-[12px] font-semibold text-brand-700 hover:underline">
              Clear
            </button>
          )}
        </div>
        {panel}
      </aside>
    </>
  );
}

function Section({
  title, open, onToggle, children,
}: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink-100 py-2 last:border-0">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-2 py-2 text-left">
        <span className="text-[13px] font-bold uppercase tracking-wide text-ink-800">{title}</span>
        <ChevronDown className={cn('h-4 w-4 text-ink-400 transition', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}
