'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check, ImageOff, Loader2, Save, Search, Undo2, ExternalLink,
} from 'lucide-react';
import { cn, formatNumber, formatPrice } from '@/lib/utils';

type Row = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockAlert: number;
  price: number;
  costPrice: number;
  image: string;
  status: string;
  category: string;
};

type Edit = { stock?: number; lowStockAlert?: number; price?: number; costPrice?: number };

export default function InventoryTable({ products }: { products: Row[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [err, setErr] = useState('');

  const rows = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, search]);

  const dirtyIds = Object.keys(edits);
  const dirtyCount = dirtyIds.length;

  function set(id: string, key: keyof Edit, value: string) {
    const num = value === '' ? undefined : Number(value);
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: num } }));
  }

  function val(p: Row, key: keyof Edit) {
    const e = edits[p.id];
    if (e && e[key] !== undefined) return e[key] as number;
    return p[key];
  }

  function isDirty(p: Row, key: keyof Edit) {
    return edits[p.id]?.[key] !== undefined;
  }

  async function saveAll() {
    if (!dirtyCount) return;
    setSaving(true);
    setErr('');
    try {
      const updates = dirtyIds.map((id) => ({ id, ...edits[id] }));
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setEdits({});
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2500);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const cellCls = (dirty: boolean) =>
    cn('input h-9 px-2 text-[15px]', dirty && 'border-amber-400 bg-amber-50 ring-1 ring-amber-200');

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or SKU…"
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {err && <span className="text-[13px] font-medium text-rose-600">{err}</span>}
          {savedAt && (
            <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          {dirtyCount > 0 && (
            <button onClick={() => setEdits({})} className="btn-outline btn-sm">
              <Undo2 className="h-3.5 w-3.5" /> Discard
            </button>
          )}
          <button onClick={saveAll} disabled={!dirtyCount || saving} className="btn-primary btn-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save {dirtyCount > 0 ? `${dirtyCount} change${dirtyCount > 1 ? 's' : ''}` : ''}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-ink-50/70">
            <tr>
              <th className="th">Product</th>
              <th className="th">Category</th>
              <th className="th w-28">Stock</th>
              <th className="th w-28">Alert at</th>
              <th className="th w-32">Cost (৳)</th>
              <th className="th w-32">Price (৳)</th>
              <th className="th">Status</th>
              <th className="th w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((p) => {
                const stock = val(p, 'stock') as number;
                const alert = val(p, 'lowStockAlert') as number;
                const cost = val(p, 'costPrice') as number || 0;
                const price = val(p, 'price') as number;
                const margin = cost > 0 && price > 0 ? Math.round(((price - cost) / price) * 100) : null;

                return (
                  <tr key={p.id} className="border-b border-ink-100 transition hover:bg-ink-50/50">
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff className="h-4 w-4 text-ink-300" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[220px]">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="block truncate font-medium text-ink-900 hover:text-brand-700"
                          >
                            {p.name}
                          </Link>
                          <span className="block truncate font-mono text-[12px] text-ink-400">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td text-ink-500">{p.category}</td>
                    <td className="td">
                      <input
                        type="number"
                        min={0}
                        value={stock}
                        onChange={(e) => set(p.id, 'stock', e.target.value)}
                        className={cellCls(isDirty(p, 'stock'))}
                      />
                    </td>
                    <td className="td">
                      <input
                        type="number"
                        min={0}
                        value={alert}
                        onChange={(e) => set(p.id, 'lowStockAlert', e.target.value)}
                        className={cellCls(isDirty(p, 'lowStockAlert'))}
                      />
                    </td>
                    <td className="td">
                      <input
                        type="number"
                        min={0}
                        value={cost || ''}
                        placeholder="—"
                        onChange={(e) => set(p.id, 'costPrice', e.target.value)}
                        className={cellCls(isDirty(p, 'costPrice'))}
                      />
                    </td>
                    <td className="td">
                      <input
                        type="number"
                        min={0}
                        value={price}
                        onChange={(e) => set(p.id, 'price', e.target.value)}
                        className={cellCls(isDirty(p, 'price'))}
                      />
                      {margin !== null && (
                        <span className="mt-1 block text-[12px] font-medium text-ink-400">{margin}% margin</span>
                      )}
                    </td>
                    <td className="td">
                      {stock <= 0 ? (
                        <span className="badge border border-rose-200 bg-rose-50 text-rose-700">Out of stock</span>
                      ) : stock <= alert ? (
                        <span className="badge border border-amber-200 bg-amber-50 text-amber-700">Low stock</span>
                      ) : (
                        <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700">In stock</span>
                      )}
                    </td>
                    <td className="td">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                        title="Open product"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="td py-14 text-center text-ink-400">
                  {search ? `No products match “${search}”.` : 'No products in this filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dirtyCount > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-ink-100 bg-amber-50/90 px-4 py-3 backdrop-blur">
          <p className="text-[15px] font-medium text-amber-800">
            {dirtyCount} unsaved change{dirtyCount > 1 ? 's' : ''} — remember to save.
          </p>
          <button onClick={saveAll} disabled={saving} className="btn-primary btn-sm">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save all
          </button>
        </div>
      )}
    </div>
  );
}
