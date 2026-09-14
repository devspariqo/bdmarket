'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Check, ChevronDown, ChevronRight, GripVertical, Loader2, Monitor,
  Plus, Save, Smartphone, Trash2, X, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItem = { label: string; labelBn?: string; href: string; children?: { label: string; href: string }[] };
type Menu = { id: string; name: string; location: string; status: string; items: MenuItem[] };
type Source = { label: string; href: string; children?: { label: string; href: string }[] };

const LOCATIONS = [
  { key: 'header', label: 'Header — main navigation', hint: 'Shown in the sticky header with mega-dropdown' },
  { key: 'mobile', label: 'Mobile drawer menu', hint: 'Used inside the hamburger drawer on phones' },
  { key: 'footer-1', label: 'Footer — Shop', hint: 'First footer column' },
  { key: 'footer-2', label: 'Footer — Help', hint: 'Second footer column' },
];

export default function MenuBuilder({
  menus,
  linkSources,
}: {
  menus: Menu[];
  linkSources: { categories: Source[]; pages: Source[]; static: Source[] };
}) {
  const router = useRouter();
  const [active, setActive] = useState(menus[0]?.location || 'header');
  const [drafts, setDrafts] = useState<Record<string, MenuItem[]>>(
    Object.fromEntries(menus.map((m) => [m.location, m.items]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');

  const current = menus.find((m) => m.location === active);
  const items = drafts[active] || [];

  const dirty = useMemo(() => {
    if (!current) return false;
    return JSON.stringify(current.items) !== JSON.stringify(items);
  }, [current, items]);

  function setItems(next: MenuItem[]) {
    setDrafts((p) => ({ ...p, [active]: next }));
  }

  function addItem(src: { label: string; href: string; children?: { label: string; href: string }[] }) {
    setItems([...items, { label: src.label, href: src.href, children: src.children }]);
  }

  function addCustom() {
    setItems([...items, { label: 'Custom link', href: '/' }]);
  }

  function update(i: number, patch: Partial<MenuItem>) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }

  async function save() {
    if (!current) return;
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: current.id,
          name: current.name,
          location: current.location,
          status: current.status,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Location switcher */}
      <aside className="space-y-2">
        {LOCATIONS.map((loc) => {
          const menu = menus.find((m) => m.location === loc.key);
          const count = (drafts[loc.key] || []).length;
          return (
            <button
              key={loc.key}
              onClick={() => setActive(loc.key)}
              className={cn(
                'w-full rounded-xl border px-3.5 py-3 text-left transition',
                active === loc.key
                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                  : 'border-ink-200 bg-white hover:border-ink-300'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-[15px] font-semibold', active === loc.key ? 'text-brand-800' : 'text-ink-800')}>
                  {loc.label}
                </span>
                <span className="badge border border-ink-200 bg-white text-ink-500">{count}</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-400">{loc.hint}</p>
              {!menu && (
                <span className="mt-1.5 inline-block badge border border-amber-200 bg-amber-50 text-amber-700">
                  not created yet
                </span>
              )}
            </button>
          );
        })}
      </aside>

      <div className="space-y-4">
        {err && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[15px] text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          {/* Item editor */}
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
              <div>
                <h2 className="font-display text-base font-bold text-ink-900">Menu items</h2>
                <p className="text-[13px] text-ink-400">
                  {items.length} item{items.length === 1 ? '' : 's'} · drag to reorder (use arrows)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
                <button onClick={save} disabled={saving || !dirty} className="btn-primary btn-sm">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save menu
                </button>
              </div>
            </div>

            <div className="space-y-2 p-4">
              {items.length ? (
                items.map((it, i) => (
                  <div key={i} className="rounded-xl border border-ink-200 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          className="grid h-4 w-5 place-items-center rounded text-ink-400 hover:text-ink-700 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3 w-3 rotate-180" />
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === items.length - 1}
                          className="grid h-4 w-5 place-items-center rounded text-ink-400 hover:text-ink-700 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <GripVertical className="h-4 w-4 shrink-0 text-ink-300" />

                      <input
                        value={it.label}
                        onChange={(e) => update(i, { label: e.target.value })}
                        className="input h-9 flex-1 py-0 text-[15px] font-medium"
                        placeholder="Menu label"
                      />
                      <input
                        value={it.href}
                        onChange={(e) => update(i, { href: e.target.value })}
                        className="input h-9 flex-1 py-0 font-mono text-[13px]"
                        placeholder="/shop"
                      />
                      <button
                        onClick={() => remove(i)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {it.children && it.children.length > 0 && (
                      <div className="ml-11 mt-2 flex flex-wrap gap-1.5">
                        {it.children.map((c, ci) => (
                          <span
                            key={ci}
                            className="rounded-md border border-ink-200 bg-ink-50 px-2 py-0.5 text-[12px] text-ink-600"
                          >
                            {c.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="grid place-items-center py-10 text-center">
                  <Layers className="h-7 w-7 text-ink-300" />
                  <p className="mt-2 text-[15px] font-medium text-ink-600">This menu is empty.</p>
                  <p className="text-[13px] text-ink-400">Add items from the panel on the right.</p>
                </div>
              )}
            </div>
          </div>

          {/* Link sources + preview */}
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold text-ink-900">Add links</h3>
                <button onClick={addCustom} className="btn-outline btn-sm">
                  <Plus className="h-3.5 w-3.5" /> Custom
                </button>
              </div>

              <SourceGroup title="Categories" sources={linkSources.categories} onAdd={addItem} />
              <SourceGroup title="Pages" sources={linkSources.pages} onAdd={addItem} />
              <SourceGroup title="Common links" sources={linkSources.static} onAdd={addItem} />
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[15px] font-bold text-ink-900">Live preview</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPreview('desktop')}
                    className={cn('grid h-7 w-7 place-items-center rounded-lg', preview === 'desktop' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-100')}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPreview('mobile')}
                    className={cn('grid h-7 w-7 place-items-center rounded-lg', preview === 'mobile' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-100')}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  'mt-3 overflow-hidden rounded-xl border border-ink-200 bg-ink-50 p-3',
                  preview === 'mobile' && 'mx-auto max-w-[220px]'
                )}
              >
                {active.startsWith('footer') ? (
                  <ul className="space-y-1.5">
                    {items.map((it, i) => (
                      <li key={i} className="text-[13px] text-ink-600 hover:text-brand-700">
                        {it.label}
                      </li>
                    ))}
                    {!items.length && <li className="text-[13px] text-ink-400">No links</li>}
                  </ul>
                ) : (
                  <div className={cn('flex gap-3', preview === 'mobile' && 'flex-col')}>
                    <span className="font-display text-[15px] font-bold text-brand-700">BD Market</span>
                    <nav className={cn('flex flex-wrap gap-2.5', preview === 'mobile' && 'flex-col gap-1.5')}>
                      {items.map((it, i) => (
                        <span key={i} className="flex items-center gap-1 text-[13px] font-medium text-ink-600">
                          {it.label}
                          {it.children && it.children.length > 0 && <ChevronDown className="h-3 w-3" />}
                        </span>
                      ))}
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceGroup({
  title,
  sources,
  onAdd,
}: {
  title: string;
  sources: Source[];
  onAdd: (s: Source) => void;
}) {
  const [open, setOpen] = useState(title === 'Categories');

  if (!sources.length) return null;

  return (
    <div className="mt-3 border-t border-ink-100 pt-3 first:border-0 first:pt-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[13px] font-bold uppercase tracking-wide text-ink-500 hover:text-ink-700"
      >
        {title}
        <span className="flex items-center gap-1.5 text-[12px] font-normal normal-case text-ink-400">
          {sources.length}
          <ChevronRight className={cn('h-3.5 w-3.5 transition', open && 'rotate-90')} />
        </span>
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          {sources.map((s) => (
            <button
              key={s.href}
              onClick={() => onAdd(s)}
              className="group flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              <span className="truncate">
                {s.label}
                {s.children && s.children.length > 0 && (
                  <span className="ml-1 text-[12px] text-ink-400">+{s.children.length}</span>
                )}
              </span>
              <Plus className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
