'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Eye, Image as ImageIcon, Loader2, Megaphone, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  position: string;
  bgColor: string | null;
  textColor: string | null;
  position_order: number;
  status: string;
};

const EMPTY = {
  id: '',
  title: '',
  subtitle: '',
  image: '',
  ctaLabel: 'Shop now',
  ctaHref: '/shop',
  position: 'hero',
  bgColor: '#006a4e',
  textColor: '#ffffff',
  position_order: 0,
  status: 'active',
};

const POSITIONS = [
  { key: 'hero', label: 'Hero carousel', hint: 'Large homepage slider' },
  { key: 'promo-1', label: 'Promo tile 1', hint: 'Left promo banner on homepage' },
  { key: 'promo-2', label: 'Promo tile 2', hint: 'Right promo banner on homepage' },
  { key: 'strip', label: 'Announcement strip', hint: 'Thin bar below the header' },
];

export default function BannerManager({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const [list, setList] = useState(banners);
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useMemo(() => setList(banners), [banners]);

  const grouped = useMemo(() => {
    const map: Record<string, Banner[]> = {};
    for (const b of list) (map[b.position] ||= []).push(b);
    return map;
  }, [list]);

  async function save() {
    if (!panel) return;
    if (!panel.title.trim() || !panel.image.trim()) return setErr('Title and image are both required');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...panel, id: panel.id || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPanel(null);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(b: Banner) {
    const next = b.status === 'active' ? 'hidden' : 'active';
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, status: next }),
      });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.map((x) => (x.id === b.id ? { ...x, status: next } : x)));
      router.refresh();
    } catch {
      alert('Could not update this banner.');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this banner?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.filter((b) => b.id !== id));
      router.refresh();
    } catch {
      alert('Could not delete this banner.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setErr('');
            setPanel({ ...EMPTY, position_order: list.length });
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> New banner
        </button>
      </div>

      {POSITIONS.map((pos) => {
        const group = grouped[pos.key] || [];
        if (!group.length && pos.key !== 'hero') return null;

        return (
          <section key={pos.key} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-base font-bold text-ink-900">{pos.label}</h2>
              <span className="text-[13px] text-ink-400">{pos.hint}</span>
              <span className="badge border border-ink-200 bg-white text-ink-500">{group.length}</span>
            </div>

            {group.length ? (
              <div className={cn('grid gap-3', pos.key === 'hero' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}>
                {group.map((b) => (
                  <div key={b.id} className="card group overflow-hidden">
                    <div className={cn('relative overflow-hidden bg-ink-100', pos.key === 'hero' ? 'aspect-[16/7]' : 'aspect-[16/9]')}>
                      {b.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <ImageIcon className="h-6 w-6 text-ink-300" />
                        </div>
                      )}
                      <div
                        className="absolute inset-0 flex flex-col justify-end p-3"
                        style={{
                          background: `linear-gradient(to top, ${b.bgColor || '#006a4e'}dd, transparent 70%)`,
                        }}
                      >
                        <p className="font-display text-[15px] font-bold" style={{ color: b.textColor || '#fff' }}>
                          {b.title}
                        </p>
                        {b.subtitle && (
                          <p className="mt-0.5 line-clamp-1 text-[12px] opacity-90" style={{ color: b.textColor || '#fff' }}>
                            {b.subtitle}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'absolute right-2 top-2 badge border-0',
                          b.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-ink-800/70 text-white'
                        )}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 border-t border-ink-100 p-2">
                      <span className="flex-1 truncate px-1.5 font-mono text-[12px] text-ink-400">
                        #{b.position_order} · {b.ctaHref || 'no link'}
                      </span>
                      <button
                        onClick={() => toggle(b)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100"
                        title={b.status === 'active' ? 'Hide' : 'Show'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setErr('');
                          setPanel({
                            id: b.id,
                            title: b.title,
                            subtitle: b.subtitle || '',
                            image: b.image,
                            ctaLabel: b.ctaLabel || '',
                            ctaHref: b.ctaHref || '',
                            position: b.position,
                            bgColor: b.bgColor || '#006a4e',
                            textColor: b.textColor || '#ffffff',
                            position_order: b.position_order,
                            status: b.status,
                          });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        disabled={deleting === b.id}
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                      >
                        {deleting === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card grid place-items-center border-dashed py-10 text-center">
                <Megaphone className="h-7 w-7 text-ink-300" />
                <p className="mt-2 text-[15px] font-medium text-ink-600">No hero banners yet</p>
                <p className="text-[13px] text-ink-400">The homepage will fall back to its default hero.</p>
              </div>
            )}
          </section>
        );
      })}

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit banner' : 'New banner'}
              </h2>
              <button onClick={() => setPanel(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 p-5">
              {err && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[15px] text-rose-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
                </div>
              )}

              <div>
                <label className="label">Headline *</label>
                <input
                  value={panel.title}
                  onChange={(e) => setPanel({ ...panel, title: e.target.value })}
                  className="input"
                  placeholder="Eid Collection 2026"
                />
              </div>

              <div>
                <label className="label">Sub-headline</label>
                <input
                  value={panel.subtitle}
                  onChange={(e) => setPanel({ ...panel, subtitle: e.target.value })}
                  className="input"
                  placeholder="Up to 40% off on premium panjabi"
                />
              </div>

              <div>
                <label className="label">Image URL *</label>
                <input
                  value={panel.image}
                  onChange={(e) => setPanel({ ...panel, image: e.target.value })}
                  className="input"
                  placeholder="https://images.unsplash.com/…"
                />
              </div>

              {panel.image && (
                <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-ink-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={panel.image} alt="" className="h-full w-full object-cover" />
                  <div
                    className="absolute inset-0 flex flex-col justify-end p-4"
                    style={{ background: `linear-gradient(to top, ${panel.bgColor}dd, transparent 70%)` }}
                  >
                    <p className="font-display text-lg font-bold" style={{ color: panel.textColor }}>
                      {panel.title || 'Headline preview'}
                    </p>
                    {panel.subtitle && (
                      <p className="text-[15px] opacity-90" style={{ color: panel.textColor }}>
                        {panel.subtitle}
                      </p>
                    )}
                    {panel.ctaLabel && (
                      <span className="mt-2 w-fit rounded-lg bg-white/95 px-3 py-1 text-[13px] font-semibold text-ink-900">
                        {panel.ctaLabel}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Button label</label>
                  <input
                    value={panel.ctaLabel}
                    onChange={(e) => setPanel({ ...panel, ctaLabel: e.target.value })}
                    className="input"
                    placeholder="Shop now"
                  />
                </div>
                <div>
                  <label className="label">Button link</label>
                  <input
                    value={panel.ctaHref}
                    onChange={(e) => setPanel({ ...panel, ctaHref: e.target.value })}
                    className="input font-mono text-[13px]"
                    placeholder="/shop"
                  />
                </div>
              </div>

              <div>
                <label className="label">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {POSITIONS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPanel({ ...panel, position: p.key })}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-[13px] transition',
                        panel.position === p.key
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                          : 'border-ink-200 text-ink-600 hover:border-ink-300'
                      )}
                    >
                      <span className="block font-semibold">{p.label}</span>
                      <span className="block text-[12px] text-ink-400">{p.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Overlay colour</label>
                  <input
                    type="color"
                    value={panel.bgColor}
                    onChange={(e) => setPanel({ ...panel, bgColor: e.target.value })}
                    className="input h-11 p-1"
                  />
                </div>
                <div>
                  <label className="label">Text colour</label>
                  <input
                    type="color"
                    value={panel.textColor}
                    onChange={(e) => setPanel({ ...panel, textColor: e.target.value })}
                    className="input h-11 p-1"
                  />
                </div>
                <div>
                  <label className="label">Order</label>
                  <input
                    type="number"
                    value={panel.position_order}
                    onChange={(e) => setPanel({ ...panel, position_order: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  value={panel.status}
                  onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                  className="select"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {panel.id ? 'Save changes' : 'Create banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
