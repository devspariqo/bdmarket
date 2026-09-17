'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2, Check, Save, Plus, X, Image as ImageIcon, AlertCircle,
  Package, Tag, Globe, Layers, Search, Info,
} from 'lucide-react';
import { cn, slugify, parseJSON } from '@/lib/utils';
import ProductImageUploader from '@/components/admin/ProductImageUploader';

type Cat = { id: string; name: string; parentId: string | null };
type Brand = { id: string; name: string };

const TABS = [
  { key: 'general', label: 'General', icon: Info },
  { key: 'pricing', label: 'Pricing', icon: Tag },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'images', label: 'Images', icon: ImageIcon },
  { key: 'variants', label: 'Variants', icon: Layers },
  { key: 'seo', label: 'SEO', icon: Globe },
] as const;

export default function ProductEditor({
  categories, brands, product, base,
}: { categories: Cat[]; brands: Brand[]; product: any; base: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<typeof TABS[number]['key']>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    name: product?.name || '',
    nameBn: product?.nameBn || '',
    slug: product?.slug || '',
    sku: product?.sku || '',
    barcode: product?.barcode || '',
    type: product?.type || 'simple',
    description: product?.description || '',
    shortDesc: product?.shortDesc || '',
    price: product?.price ?? '',
    comparePrice: product?.comparePrice ?? '',
    costPrice: product?.costPrice ?? '',
    stock: product?.stock ?? 0,
    lowStockAlert: product?.lowStockAlert ?? 5,
    manageStock: product?.manageStock ?? true,
    stockStatus: product?.stockStatus || 'instock',
    weight: product?.weight ?? '',
    dimensions: product?.dimensions || '',
    categoryId: product?.categoryId || '',
    brandId: product?.brandId || '',
    images: parseJSON<string[]>(product?.images, []),
    tags: product?.tags || '',
    fabric: product?.fabric || '',
    occasion: product?.occasion || '',
    fit: product?.fit || '',
    careInstructions: product?.careInstructions || '',
    countryOfOrigin: product?.countryOfOrigin || 'Bangladesh',
    status: product?.status || 'published',
    featured: product?.featured ?? false,
    bestseller: product?.bestseller ?? false,
    newArrival: product?.newArrival ?? true,
    metaTitle: product?.metaTitle || '',
    metaDesc: product?.metaDesc || '',
    metaKeywords: product?.metaKeywords || '',
    variants: parseJSON<any[]>(product?.variants, []),
    attributes: parseJSON<any[]>(product?.attributes, []),
  });

  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setErr('');
  }

  function autoSlug() {
    const s = slugify(form.name);
    set('slug', s);
    if (!form.metaTitle) set('metaTitle', `${form.name} — Buy Online in Bangladesh | BD Market`);
  }

  function addSize() {
    if (!sizeInput.trim()) return;
    const sizes = getAttr('Size');
    if (!sizes.includes(sizeInput.trim())) setAttr('Size', [...sizes, sizeInput.trim()]);
    setSizeInput('');
  }

  function addColor() {
    if (!colorInput.trim()) return;
    const colors = getAttr('Color');
    if (!colors.includes(colorInput.trim())) setAttr('Color', [...colors, colorInput.trim()]);
    setColorInput('');
  }

  function getAttr(name: string): string[] {
    return form.attributes.find((a: any) => a.name === name)?.values || [];
  }

  function setAttr(name: string, values: string[]) {
    setForm((f) => {
      const others = f.attributes.filter((a: any) => a.name !== name);
      return { ...f, attributes: values.length ? [...others, { name, values }] : others };
    });
  }

  function generateVariants() {
    const sizes = getAttr('Size');
    const colors = getAttr('Color');
    if (!sizes.length && !colors.length) {
      setErr('Add at least one size or colour attribute first.');
      return;
    }
    const combos: any[] = [];
    const sList = sizes.length ? sizes : [''];
    const cList = colors.length ? colors : [''];
    for (const s of sList) {
      for (const c of cList) {
        combos.push({
          id: `${s}-${c}`.toLowerCase().replace(/[^a-z0-9-]/g, '') || `v-${combos.length}`,
          size: s, color: c,
          price: Number(form.price) || 0,
          stock: 10,
          sku: `${form.sku || 'SKU'}-${s}-${c}`.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
        });
      }
    }
    set('variants', combos);
  }

  async function save(publishOverride?: string) {
    if (!form.name.trim()) { setErr('Product name is required'); setTab('general'); return; }
    if (!form.sku.trim()) { setErr('SKU is required'); setTab('general'); return; }
    if (!form.price || Number(form.price) <= 0) { setErr('A valid price is required'); setTab('pricing'); return; }

    setSaving(true);
    setErr('');
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      price: Number(form.price),
      comparePrice: form.comparePrice === '' ? null : Number(form.comparePrice),
      costPrice: form.costPrice === '' ? null : Number(form.costPrice),
      stock: Number(form.stock),
      lowStockAlert: Number(form.lowStockAlert),
      weight: form.weight === '' ? null : Number(form.weight),
      categoryId: form.categoryId || null,
      brandId: form.brandId || null,
      status: publishOverride || form.status,
    };

    try {
      const res = await fetch(product ? `/api/admin/products/${product.id}` : '/api/admin/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved(true);
      router.refresh();
      if (!product && data.product?.id) {
        router.push(`${base}/products/${data.product.id}`);
      }
      setTimeout(() => setSaved(false), 2200);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inp = (id: string, label: string, key: keyof typeof form, props: any = {}, hint?: string) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id} value={form[key] as any}
        onChange={(e) => set(key, e.target.value as any)}
        className="input" {...props}
      />
      {hint && <p className="mt-1 text-[12px] text-ink-400">{hint}</p>}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
      {/* Main */}
      <div>
        {/* Tabs */}
        <div className="mb-5 flex gap-1 overflow-x-auto border-b border-ink-200 pb-px no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-[13px] font-bold transition',
                tab === t.key
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {err && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[13px] font-semibold text-rose-800">{err}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* ── GENERAL ── */}
          {tab === 'general' && (
            <>
              <section className="rounded-2xl border border-ink-200 bg-white p-5">
                <h2 className="mb-4 font-display text-base font-bold text-ink-900">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="label">Product Name *</label>
                    <input
                      id="name" value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      onBlur={() => !form.slug && autoSlug()}
                      className="input" placeholder="e.g. Premium Embroidered Cotton Panjabi"
                    />
                  </div>
                  <div>
                    <label htmlFor="nameBn" className="label">Product Name (Bangla)</label>
                    <input
                      id="nameBn" value={form.nameBn}
                      onChange={(e) => set('nameBn', e.target.value)}
                      className="input bn" placeholder="প্রিমিয়াম এমব্রয়ডারি কটন পাঞ্জাবি"
                    />
                  </div>
                  <div>
                    <label htmlFor="slug" className="label">URL Slug</label>
                    <div className="flex gap-2">
                      <input
                        id="slug" value={form.slug}
                        onChange={(e) => set('slug', slugify(e.target.value))}
                        className="input font-mono text-[13px]" placeholder="premium-cotton-panjabi"
                      />
                      <button onClick={autoSlug} type="button" className="btn-outline btn-sm shrink-0">Auto</button>
                    </div>
                    <p className="mt-1 text-[12px] text-ink-400">/product/{form.slug || 'url-slug'}</p>
                  </div>
                  <div>
                    <label htmlFor="shortDesc" className="label">Short Description</label>
                    <textarea
                      id="shortDesc" rows={2} value={form.shortDesc}
                      onChange={(e) => set('shortDesc', e.target.value)}
                      className="textarea min-h-[70px]" placeholder="One or two lines shown on product cards and search results."
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="label">Full Description</label>
                    <textarea
                      id="description" rows={8} value={form.description}
                      onChange={(e) => set('description', e.target.value)}
                      className="textarea" placeholder="Detailed product information. Use blank lines to separate paragraphs."
                    />
                    <p className="mt-1 text-[12px] text-ink-400">Separate paragraphs with a blank line. Lines starting with "-" render as bullets.</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-ink-200 bg-white p-5">
                <h2 className="mb-4 font-display text-base font-bold text-ink-900">Organisation</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="categoryId" className="label">Category</label>
                    <select id="categoryId" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className="select">
                      <option value="">— No category —</option>
                      {categories.filter((c) => !c.parentId).map((parent) => (
                        <optgroup key={parent.id} label={parent.name}>
                          <option value={parent.id}>{parent.name} (parent)</option>
                          {categories.filter((c) => c.parentId === parent.id).map((ch) => (
                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="brandId" className="label">Brand</label>
                    <select id="brandId" value={form.brandId} onChange={(e) => set('brandId', e.target.value)} className="select">
                      <option value="">— No brand —</option>
                      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="tags" className="label">Tags</label>
                  <input
                    id="tags" value={form.tags}
                    onChange={(e) => set('tags', e.target.value)}
                    className="input" placeholder="panjabi, eid, traditional, men"
                  />
                  <p className="mt-1 text-[12px] text-ink-400">Comma separated. Used for search and filtering.</p>
                </div>
              </section>

              <section className="rounded-2xl border border-ink-200 bg-white p-5">
                <h2 className="mb-4 font-display text-base font-bold text-ink-900">Fashion Attributes</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {inp('fabric', 'Fabric', 'fabric', { placeholder: '100% Cotton' })}
                  {inp('occasion', 'Occasion', 'occasion', { placeholder: 'Eid, Wedding, Daily' })}
                  {inp('fit', 'Fit', 'fit', { placeholder: 'Regular Fit' })}
                  {inp('countryOfOrigin', 'Country of Origin', 'countryOfOrigin', { placeholder: 'Bangladesh' })}
                </div>
                <div className="mt-4">
                  <label htmlFor="careInstructions" className="label">Care Instructions</label>
                  <textarea
                    id="careInstructions" rows={2} value={form.careInstructions}
                    onChange={(e) => set('careInstructions', e.target.value)}
                    className="textarea min-h-[60px]" placeholder="Machine wash cold. Do not bleach."
                  />
                </div>
              </section>
            </>
          )}

          {/* ── PRICING ── */}
          {tab === 'pricing' && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink-900">Pricing</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="price" className="label">Regular Price (৳) *</label>
                  <input
                    id="price" type="number" min="0" step="1" value={form.price}
                    onChange={(e) => set('price', e.target.value)} className="input"
                  />
                </div>
                <div>
                  <label htmlFor="comparePrice" className="label">Compare Price (৳)</label>
                  <input
                    id="comparePrice" type="number" min="0" step="1" value={form.comparePrice}
                    onChange={(e) => set('comparePrice', e.target.value)} className="input"
                  />
                  <p className="mt-1 text-[12px] text-ink-400">Original price — shows as strikethrough</p>
                </div>
                <div>
                  <label htmlFor="costPrice" className="label">Cost Price (৳)</label>
                  <input
                    id="costPrice" type="number" min="0" step="1" value={form.costPrice}
                    onChange={(e) => set('costPrice', e.target.value)} className="input"
                  />
                  <p className="mt-1 text-[12px] text-ink-400">Used to calculate profit margin</p>
                </div>
              </div>

              {Number(form.price) > 0 && Number(form.comparePrice) > Number(form.price) && (
                <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                  <p className="text-[13px] font-bold text-emerald-900">
                    Discount: ৳{(Number(form.comparePrice) - Number(form.price)).toLocaleString()} (
                    {Math.round(((Number(form.comparePrice) - Number(form.price)) / Number(form.comparePrice)) * 100)}% off)
                  </p>
                  {Number(form.costPrice) > 0 && (
                    <p className="mt-1 text-[12px] text-emerald-700">
                      Profit per unit: ৳{(Number(form.price) - Number(form.costPrice)).toLocaleString()} ·{' '}
                      Margin: {(((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── INVENTORY ── */}
          {tab === 'inventory' && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-4 font-display text-base font-bold text-ink-900">Inventory</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sku" className="label">SKU *</label>
                  <input
                    id="sku" value={form.sku}
                    onChange={(e) => set('sku', e.target.value.toUpperCase())}
                    className="input font-mono text-[13px]" placeholder="BDM-PNJ-001"
                  />
                </div>
                {inp('barcode', 'Barcode (ISBN, UPC, GTIN)', 'barcode', { className: 'input font-mono text-[13px]' })}
                <div>
                  <label htmlFor="stock" className="label">Stock Quantity</label>
                  <input
                    id="stock" type="number" min="0" value={form.stock}
                    onChange={(e) => set('stock', e.target.value)} className="input"
                  />
                </div>
                <div>
                  <label htmlFor="lowStockAlert" className="label">Low Stock Threshold</label>
                  <input
                    id="lowStockAlert" type="number" min="0" value={form.lowStockAlert}
                    onChange={(e) => set('lowStockAlert', e.target.value)} className="input"
                  />
                  <p className="mt-1 text-[12px] text-ink-400">Get alerted when stock drops below this</p>
                </div>
                <div>
                  <label htmlFor="stockStatus" className="label">Stock Status</label>
                  <select id="stockStatus" value={form.stockStatus} onChange={(e) => set('stockStatus', e.target.value)} className="select">
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                    <option value="onbackorder">On Backorder</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="weight" className="label">Weight (kg)</label>
                  <input
                    id="weight" type="number" step="0.01" value={form.weight}
                    onChange={(e) => set('weight', e.target.value)} className="input"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="dimensions" className="label">Dimensions (L × W × H cm)</label>
                <input
                  id="dimensions" value={form.dimensions}
                  onChange={(e) => set('dimensions', e.target.value)} className="input" placeholder="30 × 20 × 5"
                />
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox" checked={form.manageStock}
                  onChange={(e) => set('manageStock', e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[15px] font-medium text-ink-700">Track quantity for this product</span>
              </label>
            </section>
          )}

          {/* ── IMAGES ── */}
          {tab === 'images' && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-1 font-display text-base font-bold text-ink-900">Product Images</h2>
              <p className="mb-4 text-[13px] text-ink-500">
                Upload photos or paste a URL. The first image is the main product photo — drag any
                thumbnail to the front, or hover it and press the star.
              </p>

              <ProductImageUploader images={form.images} onChange={(next) => set('images', next)} />

              {/* Suggested images — handy while the merchant has no photography yet */}
              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-ink-500">Quick Pick (Demo Images)</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80',
                  ].map((u) => (
                    <button
                      key={u} onClick={() => set('images', [...form.images, u])} type="button"
                      className="h-14 w-12 overflow-hidden rounded-lg border border-ink-200 transition hover:border-brand-500"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── VARIANTS ── */}
          {tab === 'variants' && (
            <>
              <section className="rounded-2xl border border-ink-200 bg-white p-5">
                <h2 className="mb-1 font-display text-base font-bold text-ink-900">Attributes</h2>
                <p className="mb-4 text-[13px] text-ink-500">Define sizes and colours, then generate variants.</p>

                <div className="space-y-4">
                  <div>
                    <label className="label">Sizes</label>
                    <div className="flex gap-2">
                      <input
                        value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
                        className="input text-[13px]" placeholder="e.g. M, L, XL"
                      />
                      <button onClick={addSize} type="button" className="btn-outline btn-sm shrink-0"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((s) => (
                        <button
                          key={s} type="button"
                          onClick={() => { const cur = getAttr('Size'); setAttr('Size', cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]); }}
                          className={cn('chip px-2.5 py-1 text-[12px]', getAttr('Size').includes(s) && 'chip-active')}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {getAttr('Size').length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {getAttr('Size').map((s) => (
                          <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[12px] font-semibold text-ink-700">
                            {s}
                            <button onClick={() => setAttr('Size', getAttr('Size').filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Colours</label>
                    <div className="flex gap-2">
                      <input
                        value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                        className="input text-[13px]" placeholder="e.g. Navy, Maroon"
                      />
                      <button onClick={addColor} type="button" className="btn-outline btn-sm shrink-0"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['White', 'Black', 'Navy', 'Maroon', 'Red', 'Green', 'Blue', 'Grey', 'Beige', 'Cream', 'Gold', 'Pink'].map((c) => (
                        <button
                          key={c} type="button"
                          onClick={() => { const cur = getAttr('Color'); setAttr('Color', cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]); }}
                          className={cn('chip px-2.5 py-1 text-[12px]', getAttr('Color').includes(c) && 'chip-active')}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {getAttr('Color').length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {getAttr('Color').map((c) => (
                          <span key={c} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-2.5 py-1 text-[12px] font-semibold text-ink-700">
                            {c}
                            <button onClick={() => setAttr('Color', getAttr('Color').filter((x) => x !== c))} aria-label={`Remove ${c}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={generateVariants} type="button" className="btn-dark btn-sm">
                    <Layers className="h-3.5 w-3.5" /> Generate Variants
                  </button>
                </div>
              </section>

              {form.variants.length > 0 && (
                <section className="rounded-2xl border border-ink-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-ink-900">
                      Variants ({form.variants.length})
                    </h2>
                    <button onClick={() => set('variants', [])} className="text-[12px] font-semibold text-rose-600 hover:underline">
                      Clear all
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead className="border-b border-ink-100">
                        <tr>
                          <th className="th">Size</th>
                          <th className="th">Colour</th>
                          <th className="th">SKU</th>
                          <th className="th">Price (৳)</th>
                          <th className="th">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-100">
                        {form.variants.map((v: any, i: number) => (
                          <tr key={i}>
                            <td className="td text-[13px] font-semibold">{v.size || '—'}</td>
                            <td className="td text-[13px]">{v.color || '—'}</td>
                            <td className="td">
                              <input
                                value={v.sku}
                                onChange={(e) => {
                                  const nv = [...form.variants];
                                  nv[i] = { ...nv[i], sku: e.target.value };
                                  set('variants', nv);
                                }}
                                className="input px-2 py-1 font-mono text-[12px]"
                              />
                            </td>
                            <td className="td">
                              <input
                                type="number" value={v.price}
                                onChange={(e) => {
                                  const nv = [...form.variants];
                                  nv[i] = { ...nv[i], price: Number(e.target.value) };
                                  set('variants', nv);
                                }}
                                className="input w-24 px-2 py-1 text-[13px]"
                              />
                            </td>
                            <td className="td">
                              <input
                                type="number" value={v.stock}
                                onChange={(e) => {
                                  const nv = [...form.variants];
                                  nv[i] = { ...nv[i], stock: Number(e.target.value) };
                                  set('variants', nv);
                                }}
                                className="input w-20 px-2 py-1 text-[13px]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ── SEO ── */}
          {tab === 'seo' && (
            <section className="rounded-2xl border border-ink-200 bg-white p-5">
              <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-ink-900">
                <Search className="h-4 w-4 text-brand-600" /> Search Engine Optimisation
              </h2>
              <p className="mb-4 text-[13px] text-ink-500">Control how this product appears in Google and social shares.</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="metaTitle" className="label">Meta Title</label>
                  <input
                    id="metaTitle" value={form.metaTitle}
                    onChange={(e) => set('metaTitle', e.target.value)}
                    className="input" placeholder={`${form.name || 'Product name'} — Buy Online in Bangladesh | BD Market`}
                  />
                  <p className={cn('mt-1 text-[12px]', form.metaTitle.length > 60 ? 'font-semibold text-amber-600' : 'text-ink-400')}>
                    {form.metaTitle.length}/60 characters recommended
                  </p>
                </div>
                <div>
                  <label htmlFor="metaDesc" className="label">Meta Description</label>
                  <textarea
                    id="metaDesc" rows={3} value={form.metaDesc}
                    onChange={(e) => set('metaDesc', e.target.value)}
                    className="textarea min-h-[80px]" placeholder="Compelling description shown in search results (155 characters recommended)."
                  />
                  <p className={cn('mt-1 text-[12px]', form.metaDesc.length > 160 ? 'font-semibold text-amber-600' : 'text-ink-400')}>
                    {form.metaDesc.length}/160 characters recommended
                  </p>
                </div>
                <div>
                  <label htmlFor="metaKeywords" className="label">Focus Keywords</label>
                  <input
                    id="metaKeywords" value={form.metaKeywords}
                    onChange={(e) => set('metaKeywords', e.target.value)}
                    className="input" placeholder="panjabi, eid panjabi, buy panjabi online"
                  />
                </div>

                {/* SERP preview */}
                <div className="rounded-xl border border-ink-200 bg-ink-50/60 p-4">
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-500">Search Preview</p>
                  <p className="text-[12px] text-emerald-700">bdmarket.com.bd › product › {form.slug || 'url-slug'}</p>
                  <p className="mt-0.5 text-base font-medium leading-snug text-blue-700">
                    {form.metaTitle || `${form.name || 'Product Name'} — Buy Online in Bangladesh | BD Market`}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-600">
                    {form.metaDesc || form.shortDesc || 'Add a meta description to control how this appears in search results.'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-2xl border border-ink-200 bg-white p-4">
          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-600">Publish</h3>

          <div className="space-y-3">
            <div>
              <label htmlFor="status" className="label">Status</label>
              <select id="status" value={form.status} onChange={(e) => set('status', e.target.value)} className="select py-2 text-[13px]">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-[13px] font-medium text-ink-700">Featured product</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.bestseller} onChange={(e) => set('bestseller', e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-[13px] font-medium text-ink-700">Mark as bestseller</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" checked={form.newArrival} onChange={(e) => set('newArrival', e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-[13px] font-medium text-ink-700">Show in new arrivals</span>
            </label>
          </div>

          <div className="mt-4 space-y-2 border-t border-ink-100 pt-4">
            <button onClick={() => save()} disabled={saving} className="btn-primary w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                : saved ? <><Check className="h-4 w-4" /> Saved!</>
                : <><Save className="h-4 w-4" /> Save Product</>}
            </button>
            {product && form.status !== 'draft' && (
              <button onClick={() => save('draft')} disabled={saving} className="btn-outline w-full">
                Move to Draft
              </button>
            )}
            <Link href={`${base}/products`} className="btn-ghost w-full">Cancel</Link>
          </div>
        </div>

        {/* Image preview */}
        {form.images[0] && (
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
            <p className="border-b border-ink-100 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide text-ink-500">
              Main Image Preview
            </p>
            <div className="aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.images[0]} alt="" className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        {product && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-600">Performance</h3>
            <dl className="space-y-2.5 text-[13px]">
              {[
                ['Views', product.viewCount.toLocaleString()],
                ['Units Sold', product.soldCount.toLocaleString()],
                ['Rating', `${product.rating.toFixed(1)} ★ (${product.reviewCount})`],
                ['Created', new Date(product.createdAt).toLocaleDateString('en-GB')],
                ['Updated', new Date(product.updatedAt).toLocaleDateString('en-GB')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="font-semibold text-ink-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-brand-800">Tip</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-brand-900">
            Products with 3+ images, a Bangla name and a filled meta description convert up to 40% better.
          </p>
        </div>
      </aside>
    </div>
  );
}
