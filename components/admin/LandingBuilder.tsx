'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, ChevronDown, Copy, ExternalLink, Eye, EyeOff, GripVertical, Loader2,
  MousePointerClick, Plus, Save, Search, Settings2, Trash2, X,
} from 'lucide-react';
import {
  BLOCKS, BLOCK_ORDER, type Block, type BlockType, type FieldDef,
  newBlock, isKnownBlockType, landingPath,
} from '@/lib/landing-blocks';
import { cn, formatPrice } from '@/lib/utils';
import LandingRenderer from '@/components/store/landing/LandingRenderer';
import type { LandingProduct } from '@/components/store/landing/LandingCheckout';
import ImageUploadField from '@/components/admin/settings/ImageUploadField';

/**
 * The landing-page builder.
 *
 * Two decisions worth stating:
 *
 * 1. **The preview is the real renderer.** `LandingRenderer` is imported
 *    directly rather than reimplemented, so what the merchant sees while editing
 *    is the same code that will render the page. A separate preview would drift,
 *    and a preview that lies is worse than no preview.
 *
 * 2. **The editor form is generated from `BLOCKS[type].fields`.** Adding a block
 *    type or a new prop needs no new UI code — the field definitions in
 *    lib/landing-blocks.ts drive it. That is what keeps the builder from rotting
 *    as blocks are added.
 *
 * The page is saved whole. A per-block endpoint would need conflict handling for
 * two tabs editing the same page, and the payload is small.
 */

type PageState = {
  id: string;
  title: string;
  slug: string;
  parentSlug: string;
  status: string;
  blocks: Block[];
  metaTitle: string;
  metaDesc: string;
  metaKeywords: string;
  ogImage: string;
  canonical: string;
  noIndex: boolean;
  gaId: string;
  fbPixelId: string;
  customHead: string;
  customBody: string;
  bgColor: string;
  textColor: string;
  fontFamily: string;
  maxWidth: number;
  checkoutEnabled: boolean;
};

export default function LandingBuilder({
  initial,
  products,
  siteUrl,
}: {
  initial: PageState;
  products: LandingProduct[];
  siteUrl: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState<PageState>(initial);
  const [selected, setSelected] = useState<string | null>(initial.blocks[0]?.id ?? null);
  const [tab, setTab] = useState<'content' | 'settings'>('content');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  /**
   * The last state the server confirmed, as a string.
   *
   * Without this the Save button looks identical whether or not there is anything
   * to save, so "did that save?" is unanswerable from the screen — which is the
   * difference between a builder that feels broken and one that does not.
   */
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const dirty = useMemo(() => JSON.stringify(page) !== baseline, [page, baseline]);

  // Warn before a reload or a closed tab discards unsaved work. Browsers ignore a
  // custom message and show their own, so only the presence of a handler matters.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Drag state. Only the grip makes a row draggable, so the fields inside a block
  // row stay selectable with the mouse.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [grabIndex, setGrabIndex] = useState<number | null>(null);

  const block = page.blocks.find((b) => b.id === selected) || null;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Only the products this page references, in the order the blocks list them.
  const previewProducts = useMemo(() => {
    const ids = page.blocks
      .filter((b) => b.type === 'products')
      .flatMap((b) => (Array.isArray(b.props?.productIds) ? b.props.productIds : []));
    return Array.from(new Set(ids)).map((id) => byId.get(id as string)).filter(Boolean) as LandingProduct[];
  }, [page.blocks, byId]);

  function patch(next: Partial<PageState>) {
    setPage((p) => ({ ...p, ...next }));
    setSaved(false);
  }

  function setBlocks(blocks: Block[]) {
    patch({ blocks });
  }

  function addBlock(type: BlockType) {
    const b = newBlock(type);
    setBlocks([...page.blocks, b]);
    setSelected(b.id);
    setPaletteOpen(false);
  }

  function updateProps(id: string, props: Record<string, any>) {
    setBlocks(page.blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...props } } : b)));
  }

  function updateStyle(id: string, style: Record<string, any>) {
    setBlocks(page.blocks.map((b) => (b.id === id ? { ...b, style: { ...b.style, ...style } } : b)));
  }

  function removeBlock(id: string) {
    setBlocks(page.blocks.filter((b) => b.id !== id));
    if (selected === id) setSelected(null);
  }

  function duplicateBlock(id: string) {
    const i = page.blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    // A fresh id, generated directly rather than via `newBlock`: that looks up
    // BLOCKS[type].defaults(), which would throw on an unknown type.
    const copy: Block = {
      ...page.blocks[i],
      id: `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      props: { ...page.blocks[i].props },
      style: { ...(page.blocks[i].style || {}) },
    };
    const next = [...page.blocks];
    next.splice(i + 1, 0, copy);
    setBlocks(next);
    setSelected(copy.id);
  }

  function moveBlock(from: number, to: number) {
    if (from === to) return;
    const next = [...page.blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBlocks(next);
  }

  function moveBy(id: string, dir: -1 | 1) {
    const i = page.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= page.blocks.length) return;
    moveBlock(i, j);
  }

  function dropAt(target: number) {
    if (dragIndex !== null) moveBlock(dragIndex, target);
    setDragIndex(null);
    setOverIndex(null);
    setGrabIndex(null);
  }

  async function save(nextStatus?: string) {
    setSaving(true);
    setErr('');

    // What we are asking the server to store.
    const intent: PageState = { ...page, status: nextStatus ?? page.status };

    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not save');

      /**
       * Reconcile with what actually came back.
       *
       * The server de-duplicates the slug and normalises the block list, so the
       * saved state is not necessarily the state we sent. Adopting the response
       * as the new baseline is what makes `dirty` trustworthy — and comparing the
       * block count catches the case where a write silently dropped something,
       * which is otherwise invisible until the page is reloaded.
       */
      const stored = data?.page;
      const confirmed: PageState = stored
        ? {
            ...intent,
            slug: stored.slug ?? intent.slug,
            status: stored.status ?? intent.status,
            parentSlug: stored.parentSlug ?? intent.parentSlug,
            blocks: Array.isArray(stored.blocks) ? (stored.blocks as Block[]) : intent.blocks,
          }
        : intent;

      setPage(confirmed);
      setBaseline(JSON.stringify(confirmed));

      const sentCount = intent.blocks.length;
      const keptCount = confirmed.blocks.length;
      if (keptCount !== sentCount) {
        setErr(
          `Saved, but ${sentCount - keptCount} block(s) were not stored. ` +
            `The page now has ${keptCount}. Reload to see the saved version.`
        );
      }

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const path = landingPath(page.parentSlug, page.slug);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <a
            href="/admin/landing-pages"
            className="btn-outline btn-sm"
            title="Back to the list"
            onClick={(e) => {
              // A plain link navigates client-side, which `beforeunload` does not
              // cover, so unsaved work would disappear without a word.
              if (dirty && !confirm('You have unsaved changes. Leave this page and lose them?')) {
                e.preventDefault();
              }
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </a>
          <input
            value={page.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="input h-9 min-w-0 flex-1 py-0 text-[15px] font-bold sm:min-w-[240px]"
            placeholder="Page title"
          />
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold',
              page.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-100 text-ink-600'
            )}
          >
            {page.status === 'published' ? 'Published' : 'Draft'}
          </span>
          {dirty && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[12px] font-bold text-amber-800">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={path}
            target="_blank"
            rel="noreferrer"
            className="btn-outline btn-sm"
            title="Open the live page"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View
          </a>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className={cn('btn-sm', dirty ? 'btn bg-brand-600 text-white hover:bg-brand-700' : 'btn-outline')}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : saved ? 'Saved' : dirty ? 'Save changes' : 'Save'}
          </button>
          {page.status === 'published' ? (
            <button type="button" onClick={() => save('draft')} disabled={saving} className="btn-outline btn-sm">
              <EyeOff className="h-3.5 w-3.5" /> Unpublish
            </button>
          ) : (
            <button type="button" onClick={() => save('published')} disabled={saving} className="btn btn-sm bg-brand-600 text-white hover:bg-brand-700">
              <Eye className="h-3.5 w-3.5" /> Publish
            </button>
          )}
        </div>
      </div>

      {err && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[14px] text-rose-800">{err}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* ── Left: editor ── */}
        <div className="space-y-3">
          <div className="flex gap-1 rounded-xl bg-ink-100 p-1">
            {(['content', 'settings'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 text-[13px] font-bold capitalize transition',
                  tab === t ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'
                )}
              >
                {t === 'content' ? 'Blocks' : 'Page settings'}
              </button>
            ))}
          </div>

          {tab === 'content' ? (
            <>
              {/* Add block */}
              <div className="card p-3">
                <button
                  type="button"
                  onClick={() => setPaletteOpen((o) => !o)}
                  className="btn w-full bg-brand-600 text-white hover:bg-brand-700"
                >
                  <Plus className="h-4 w-4" /> Add a block
                  <ChevronDown className={cn('ml-auto h-4 w-4 transition', paletteOpen && 'rotate-180')} />
                </button>
                {paletteOpen && (
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {BLOCK_ORDER.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addBlock(type)}
                        className="rounded-lg border border-ink-200 px-2.5 py-2 text-left transition hover:border-brand-400 hover:bg-brand-50"
                      >
                        <span className="block text-[13px] font-bold text-ink-800">{BLOCKS[type].label}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">{BLOCKS[type].hint}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Block list */}
              <div className="card divide-y divide-ink-100">
                {page.blocks.length === 0 ? (
                  <div className="grid place-items-center px-4 py-10 text-center">
                    <MousePointerClick className="h-7 w-7 text-ink-300" />
                    <p className="mt-2 text-[15px] font-medium text-ink-600">This page is empty.</p>
                    <p className="text-[13px] text-ink-400">Add a block above to start building.</p>
                  </div>
                ) : (
                  page.blocks.map((b, i) => (
                    <div
                      key={b.id}
                      draggable={grabIndex === i}
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => {
                        // Without preventDefault the browser never fires onDrop.
                        e.preventDefault();
                        setOverIndex(i);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dropAt(i);
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setOverIndex(null);
                        setGrabIndex(null);
                      }}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-2 transition',
                        overIndex === i && dragIndex !== null && dragIndex !== i && 'bg-brand-50 ring-2 ring-inset ring-brand-400',
                        dragIndex === i && 'opacity-40'
                      )}
                    >
                      <span
                        onMouseDown={() => setGrabIndex(i)}
                        onMouseUp={() => setGrabIndex(null)}
                        title="Drag to reorder"
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="h-4 w-4 shrink-0 text-ink-300" />
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelected(b.id)}
                        className={cn(
                          'min-w-0 flex-1 truncate text-left text-[13px] font-semibold',
                          selected === b.id ? 'text-brand-700' : 'text-ink-700'
                        )}
                      >
                        {BLOCKS[b.type]?.label || b.type}
                        {!isKnownBlockType(b.type) && (
                          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                            unknown — kept, not rendered
                          </span>
                        )}
                        <span className="ml-2 truncate font-normal text-ink-400">
                          {summaryOf(b)}
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button type="button" onClick={() => moveBy(b.id, -1)} disabled={i === 0} title="Move up" className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800 disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        </button>
                        <button type="button" onClick={() => moveBy(b.id, 1)} disabled={i === page.blocks.length - 1} title="Move down" className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800 disabled:opacity-30">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => duplicateBlock(b.id)} title="Duplicate" className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => removeBlock(b.id)} title="Delete" className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-rose-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {block && (
                <BlockEditor
                  key={block.id}
                  block={block}
                  products={products}
                  onProps={(p) => updateProps(block.id, p)}
                  onStyle={(s) => updateStyle(block.id, s)}
                  onClose={() => setSelected(null)}
                />
              )}
            </>
          ) : (
            <PageSettings page={page} patch={patch} siteUrl={siteUrl} />
          )}
        </div>

        {/* ── Right: preview ── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink-600">Live preview</p>
            <p className="truncate font-mono text-[12px] text-ink-400">{path}</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
            <div className="max-h-[75vh] overflow-y-auto">
              <div
                className="min-h-[300px]"
                style={{
                  background: page.bgColor || '#ffffff',
                  color: page.textColor || '#1c1917',
                  fontFamily: page.fontFamily || undefined,
                }}
              >
                {page.blocks.length === 0 ? (
                  <p className="px-6 py-16 text-center text-[14px] text-ink-400">
                    Add a block to see the preview.
                  </p>
                ) : (
                  <LandingRenderer pageId={page.id} blocks={page.blocks} products={previewProducts} />
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-ink-500">
            Rendered by the same component as the live page, so this is exactly what visitors get.
            Checkout submissions in the preview are disabled.
          </p>
        </div>
      </div>
    </div>
  );
}

/** One-line description of a block for the list. */
function summaryOf(b: Block): string {
  const p = b.props || {};
  const first = p.heading || p.text || p.label || p.title || '';
  return typeof first === 'string' ? first.slice(0, 42) : '';
}

/* ────────────────────────────── field editor ────────────────────────────── */

function BlockEditor({
  block,
  products,
  onProps,
  onStyle,
  onClose,
}: {
  block: Block;
  products: LandingProduct[];
  onProps: (p: Record<string, any>) => void;
  onStyle: (s: Record<string, any>) => void;
  onClose: () => void;
}) {
  const def = BLOCKS[block.type];

  /**
   * A block type this build does not know about.
   *
   * `parseBlocks` keeps such blocks rather than dropping them, so that opening and
   * saving a page written by a newer build cannot delete the merchant's work. It
   * has no fields to edit and the renderer skips it, so the honest thing is to say
   * so and offer to remove it — not to crash, and not to pretend it is editable.
   */
  if (!def) {
    return (
      <div className="card p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[15px] font-bold text-ink-900">Unknown block</h3>
          <button type="button" onClick={onClose} className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[13px] text-amber-900">
          This block is <code className="font-mono">{block.type}</code>, which this version of the
          builder does not recognise. It is kept as-is and skipped when the page renders, so nothing
          is lost. If it came from a newer version, updating will make it editable again.
        </p>
      </div>
    );
  }

  const style = block.style || {};

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink-900">{def.label}</h3>
        <button type="button" onClick={onClose} className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {def.fields.map((f) => (
          <FieldInput
            key={f.key}
            field={f}
            value={f.key === '__align' ? block.props?.align : block.props?.[f.key]}
            onChange={(v) => onProps({ [f.key === '__align' ? 'align' : f.key]: v })}
            products={products}
          />
        ))}
      </div>

      <div className="mt-4 border-t border-ink-100 pt-3">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-500">Block style</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-600">Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.bg || '#ffffff'}
                onChange={(e) => onStyle({ bg: e.target.value })}
                className="h-9 w-12 rounded border border-ink-200"
              />
              <button type="button" onClick={() => onStyle({ bg: '' })} className="text-[12px] text-ink-500 underline">
                clear
              </button>
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-600">Text colour</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.color || '#1c1917'}
                onChange={(e) => onStyle({ color: e.target.value })}
                className="h-9 w-12 rounded border border-ink-200"
              />
              <button type="button" onClick={() => onStyle({ color: '' })} className="text-[12px] text-ink-500 underline">
                clear
              </button>
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-600">Vertical padding (px)</span>
            <input
              type="number"
              value={style.paddingY ?? ''}
              placeholder="default"
              onChange={(e) => onStyle({ paddingY: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="input h-9 py-0"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-600">Content width (px)</span>
            <input
              type="number"
              value={style.maxWidth ?? ''}
              placeholder="page width"
              onChange={(e) => onStyle({ maxWidth: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="input h-9 py-0"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  products,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  products: LandingProduct[];
}) {
  const label = <span className="mb-1 block text-[12px] font-semibold text-ink-600">{field.label}</span>;
  const help = field.help ? <span className="mt-1 block text-[11px] leading-snug text-ink-400">{field.help}</span> : null;

  switch (field.type) {
    case 'image':
      return (
        <ImageUploadField
          value={String(value || '')}
          onChange={(url) => onChange(url)}
          label={field.label}
          hint={field.help}
          maxWidth={1600}
          previewClassName="h-20"
        />
      );

    case 'textarea':
      return (
        <label className="block">
          {label}
          <textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            rows={field.key === 'code' || field.key === 'customHead' ? 6 : 3}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-ink-200 px-3 py-2 font-mono text-[13px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          {help}
        </label>
      );

    case 'number':
      return (
        <label className="block">
          {label}
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            className="input h-9 py-0"
          />
          {help}
        </label>
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded" />
          <span className="text-[13px] font-semibold text-ink-700">{field.label}</span>
        </label>
      );

    case 'color':
      return (
        <label className="block">
          {label}
          <div className="flex items-center gap-2">
            <input type="color" value={String(value || '#000000')} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border border-ink-200" />
            <input value={String(value || '')} onChange={(e) => onChange(e.target.value)} className="input h-9 flex-1 py-0 font-mono text-[12px]" />
          </div>
          {help}
        </label>
      );

    case 'select':
      return (
        <label className="block">
          {label}
          <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className="input h-9 py-0">
            {(field.options || []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {help}
        </label>
      );

    case 'products':
      return <ProductPicker value={Array.isArray(value) ? value : []} onChange={onChange} products={products} help={field.help} />;

    case 'list':
      return <ListEditor field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />;

    default:
      return (
        <label className="block">
          {label}
          <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="input h-9 py-0" />
          {help}
        </label>
      );
  }
}

/** Multi-select over the catalogue, with search. */
function ProductPicker({
  value,
  onChange,
  products,
  help,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  products: LandingProduct[];
  help?: string;
}) {
  const [q, setQ] = useState('');
  const filtered = q
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 40)
    : products.slice(0, 40);

  const chosen = value.map((id) => products.find((p) => p.id === id)).filter(Boolean) as LandingProduct[];

  return (
    <div>
      <span className="mb-1 block text-[12px] font-semibold text-ink-600">Products</span>

      {chosen.length > 0 && (
        <div className="mb-2 space-y-1">
          {chosen.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-ink-200 px-2 py-1.5">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <span className="h-8 w-8 rounded bg-ink-100" />
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.name}</span>
              <span className="text-[12px] text-ink-500">{formatPrice(p.price)}</span>
              <button type="button" onClick={() => onChange(value.filter((id) => id !== p.id))} className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-rose-600" title="Remove">
                <X className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => {
                if (i === 0) return;
                const next = [...value];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange(next);
              }} disabled={i === 0} className="grid h-6 w-6 place-items-center rounded text-ink-400 hover:text-ink-800 disabled:opacity-30" title="Move up">
                <ChevronDown className="h-3.5 w-3.5 rotate-180" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="input h-9 py-0 pl-8"
        />
      </div>

      <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-ink-200">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-ink-400">No products match.</p>
        ) : (
          filtered.map((p) => {
            const on = value.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(on ? value.filter((id) => id !== p.id) : [...value, p.id])}
                className={cn('flex w-full items-center gap-2 px-2 py-1.5 text-left transition hover:bg-ink-50', on && 'bg-brand-50')}
              >
                <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300')}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                <span className="text-[12px] text-ink-500">{formatPrice(p.price)}</span>
              </button>
            );
          })
        )}
      </div>
      {help && <span className="mt-1 block text-[11px] leading-snug text-ink-400">{help}</span>}
    </div>
  );
}

/** Repeater for `list` fields — feature items, reviews, and the checkout's field
 *  keys, which are plain strings wrapped in `{ value }`. */
function ListEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: any[];
  onChange: (v: any[]) => void;
}) {
  const itemFields = field.itemFields || [{ key: 'value', label: 'Value', type: 'text' as const }];
  // The checkout block stores bare strings; wrap them so one editor handles both.
  const rows = value.map((v) => (typeof v === 'string' ? { value: v } : v || {}));

  function setRow(i: number, key: string, v: any) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r));
    onChange(next);
  }

  return (
    <div>
      <span className="mb-1 block text-[12px] font-semibold text-ink-600">{field.label}</span>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded-lg border border-ink-200 p-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                {itemFields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="mb-0.5 block text-[11px] font-semibold text-ink-500">{f.label}</span>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={String(row[f.key] ?? '')}
                        onChange={(e) => setRow(i, f.key, e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-ink-200 px-2 py-1 text-[13px] outline-none focus:border-brand-500"
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={row[f.key] ?? ''}
                        onChange={(e) => setRow(i, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="input h-8 py-0 text-[13px]"
                      />
                    )}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded text-ink-400 hover:text-rose-600"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, Object.fromEntries(itemFields.map((f) => [f.key, f.type === 'number' ? 5 : '']))])}
        className="btn-outline btn-sm mt-2"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
      {field.help && <span className="mt-1 block text-[11px] leading-snug text-ink-400">{field.help}</span>}
    </div>
  );
}

/* ────────────────────────────── page settings ────────────────────────────── */

function PageSettings({
  page,
  patch,
  siteUrl,
}: {
  page: PageState;
  patch: (p: Partial<PageState>) => void;
  siteUrl: string;
}) {
  const preview = `${siteUrl.replace(/\/$/, '')}${landingPath(page.parentSlug, page.slug)}`;

  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-3">
        <h3 className="flex items-center gap-1.5 font-display text-[15px] font-bold text-ink-900">
          <Settings2 className="h-4 w-4" /> Address
        </h3>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Parent slug</span>
          <input value={page.parentSlug} onChange={(e) => patch({ parentSlug: e.target.value })} className="input h-9 py-0 font-mono text-[13px]" placeholder="collection" />
          <span className="mt-1 block text-[11px] text-ink-400">
            The first part of the URL. Default is <code>collection</code>; change it to <code>offer</code>, <code>eid</code>, anything.
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Page slug</span>
          <input value={page.slug} onChange={(e) => patch({ slug: e.target.value })} className="input h-9 py-0 font-mono text-[13px]" placeholder="eid-panjabi" />
        </label>
        <p className="rounded-lg bg-ink-50 px-2.5 py-2 font-mono text-[12px] break-all text-ink-600">{preview}</p>
      </div>

      <div className="card space-y-3 p-3">
        <h3 className="font-display text-[15px] font-bold text-ink-900">Search &amp; social</h3>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Meta title</span>
          <input value={page.metaTitle} onChange={(e) => patch({ metaTitle: e.target.value })} className="input h-9 py-0" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Meta description</span>
          <textarea value={page.metaDesc} onChange={(e) => patch({ metaDesc: e.target.value })} rows={3} className="w-full rounded-xl border border-ink-200 px-3 py-2 text-[13px] outline-none focus:border-brand-500" />
        </label>
        <ImageUploadField value={page.ogImage} onChange={(url) => patch({ ogImage: url })} label="Share image (OG)" maxWidth={1200} previewClassName="h-16" />
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={page.noIndex} onChange={(e) => patch({ noIndex: e.target.checked })} className="mt-0.5 h-4 w-4 rounded" />
          <span className="text-[13px] text-ink-700">
            Hide from search engines
            <span className="mt-0.5 block text-[11px] text-ink-400">
              Useful when the page duplicates a product page you already rank for.
            </span>
          </span>
        </label>
      </div>

      <div className="card space-y-3 p-3">
        <h3 className="font-display text-[15px] font-bold text-ink-900">Tracking</h3>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Google Analytics ID</span>
          <input value={page.gaId} onChange={(e) => patch({ gaId: e.target.value })} className="input h-9 py-0 font-mono text-[12px]" placeholder="G-XXXXXXXXXX" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Facebook Pixel ID</span>
          <input value={page.fbPixelId} onChange={(e) => patch({ fbPixelId: e.target.value })} className="input h-9 py-0 font-mono text-[12px]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Custom head HTML</span>
          <textarea value={page.customHead} onChange={(e) => patch({ customHead: e.target.value })} rows={3} className="w-full rounded-xl border border-ink-200 px-3 py-2 font-mono text-[12px] outline-none focus:border-brand-500" placeholder="<meta …> or a verification tag" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Custom body HTML</span>
          <textarea value={page.customBody} onChange={(e) => patch({ customBody: e.target.value })} rows={3} className="w-full rounded-xl border border-ink-200 px-3 py-2 font-mono text-[12px] outline-none focus:border-brand-500" />
        </label>
      </div>

      <div className="card space-y-3 p-3">
        <h3 className="font-display text-[15px] font-bold text-ink-900">Appearance</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-600">Page background</span>
            <input type="color" value={page.bgColor || '#ffffff'} onChange={(e) => patch({ bgColor: e.target.value })} className="h-9 w-full rounded border border-ink-200" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-600">Text colour</span>
            <input type="color" value={page.textColor || '#1c1917'} onChange={(e) => patch({ textColor: e.target.value })} className="h-9 w-full rounded border border-ink-200" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-ink-600">Font stack (optional)</span>
          <input value={page.fontFamily} onChange={(e) => patch({ fontFamily: e.target.value })} className="input h-9 py-0 font-mono text-[12px]" placeholder="Leave empty to use the store font" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={page.checkoutEnabled} onChange={(e) => patch({ checkoutEnabled: e.target.checked })} className="h-4 w-4 rounded" />
          <span className="text-[13px] text-ink-700">Allow ordering on this page</span>
        </label>
      </div>
    </div>
  );
}
