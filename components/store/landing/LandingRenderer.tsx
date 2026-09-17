import type { Block } from '@/lib/landing-blocks';
import { videoEmbedUrl } from '@/lib/landing-blocks';
import { formatPrice } from '@/lib/utils';
import LandingCountdown from './LandingCountdown';
import LandingIcon from './LandingIcon';
import LandingCheckout, { type LandingProduct } from './LandingCheckout';

/**
 * Renders a landing page's block tree.
 *
 * A server component: the page fetches the products it needs and hands them down,
 * so there is no client-side fetch waterfall before the page is usable — which
 * matters more here than anywhere else in the store, because this page exists to
 * convert paid traffic.
 *
 * Every block renders defensively. A half-configured block shows a quiet
 * placeholder rather than throwing, because a single bad block would otherwise
 * take the whole page down and the merchant would have no way to reach the
 * builder and fix it.
 */

type Props = {
  pageId: string;
  blocks: Block[];
  products: LandingProduct[];
};

/** Section wrapper: background, text colour, vertical rhythm, alignment. */
function shell(block: Block, children: React.ReactNode, extraClass = '') {
  const s = block.style || {};
  const align = s.align || (block.props?.align as string) || undefined;
  return (
    <section
      className={extraClass}
      style={{
        background: s.bg || undefined,
        color: s.color || undefined,
        paddingTop: s.paddingY ?? undefined,
        paddingBottom: s.paddingY ?? undefined,
        textAlign: (align as any) || undefined,
      }}
    >
      <div className="mx-auto w-full px-4 sm:px-6" style={{ maxWidth: s.maxWidth || undefined }}>
        {children}
      </div>
    </section>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-ink-300 bg-ink-50 px-4 py-6 text-center text-[14px] text-ink-500">
      {text}
    </p>
  );
}

const SIZES: Record<string, string> = {
  h1: 'text-4xl sm:text-5xl',
  h2: 'text-2xl sm:text-3xl',
  h3: 'text-xl sm:text-2xl',
  h4: 'text-lg',
};

const TEXT_SIZES: Record<string, string> = {
  sm: 'text-[14px]',
  base: 'text-[16px]',
  lg: 'text-[18px]',
};

export default function LandingRenderer({ pageId, blocks, products }: Props) {
  const byId = new Map(products.map((p) => [p.id, p]));

  return (
    <>
      {blocks.map((block) => {
        const p = block.props || {};

        switch (block.type) {
          case 'hero': {
            const align = p.align || 'center';
            return (
              <section
                key={block.id}
                className="relative flex items-center justify-center overflow-hidden bg-ink-900"
                style={{ minHeight: p.height || 520 }}
              >
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: `rgba(0,0,0,${Math.min(90, Math.max(0, Number(p.overlay ?? 45))) / 100})` }}
                />
                <div className="relative mx-auto w-full max-w-3xl px-5 py-14" style={{ textAlign: align }}>
                  {p.heading && (
                    <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                      {p.heading}
                    </h1>
                  )}
                  {p.subheading && (
                    <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-white/85 sm:text-lg">
                      {p.subheading}
                    </p>
                  )}
                  {p.ctaLabel && (
                    <a
                      href={p.ctaHref || '#order'}
                      className="mt-7 inline-flex h-13 items-center justify-center rounded-xl bg-white px-7 py-3.5 text-[16px] font-bold text-ink-900 shadow-lg transition hover:bg-white/90"
                    >
                      {p.ctaLabel}
                    </a>
                  )}
                </div>
              </section>
            );
          }

          case 'heading': {
            const Level = (p.level || 'h2') as any;
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <Level className={`font-display font-bold leading-tight ${SIZES[p.level] || SIZES.h2}`}>
                    {p.text}
                  </Level>,
                  'py-6'
                )}
              </div>
            );
          }

          case 'text': {
            // Blank lines become paragraphs; single newlines stay as line breaks.
            const paragraphs = String(p.text || '')
              .split(/\n\s*\n/)
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <div className={`mx-auto leading-relaxed opacity-90 ${TEXT_SIZES[p.size] || TEXT_SIZES.base}`}>
                    {paragraphs.length ? (
                      paragraphs.map((para, i) => (
                        <p key={i} className={i ? 'mt-3' : ''}>
                          {para.split('\n').map((line, j) => (
                            <span key={j}>
                              {line}
                              {j < para.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      ))
                    ) : (
                      <Placeholder text="This text block is empty." />
                    )}
                  </div>,
                  'py-5'
                )}
              </div>
            );
          }

          case 'image': {
            if (!p.src) {
              return <div key={block.id}>{shell(block, <Placeholder text="No image chosen yet." />, 'py-5')}</div>;
            }
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.src}
                alt={p.alt || ''}
                className="mx-auto h-auto w-full object-cover"
                style={{ maxWidth: p.width || '100%', borderRadius: p.radius ?? 12 }}
              />
            );
            return (
              <div key={block.id}>
                {shell(block, p.href ? <a href={p.href}>{img}</a> : img, 'py-5')}
              </div>
            );
          }

          case 'button': {
            const size = p.size === 'lg' ? 'h-13 px-8 py-3.5 text-[16px]' : 'h-11 px-6 py-2.5 text-[15px]';
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <a
                    href={p.href || '#order'}
                    className={`inline-flex items-center justify-center rounded-xl font-bold shadow-sm transition hover:opacity-90 ${size} ${
                      p.fullWidth ? 'w-full' : ''
                    }`}
                    style={{ background: p.bg || '#0f766e', color: p.color || '#ffffff' }}
                  >
                    {p.label || 'Order now'}
                  </a>,
                  'py-5'
                )}
              </div>
            );
          }

          case 'features': {
            const items = Array.isArray(p.items) ? p.items : [];
            if (!items.length) {
              return <div key={block.id}>{shell(block, <Placeholder text="No features added yet." />, 'py-5')}</div>;
            }
            const cols = Number(p.columns || 3);
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 4 ? 180 : 220}px, 1fr))` }}
                  >
                    {items.map((it: any, i: number) => (
                      <div key={i} className="text-center">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
                          <LandingIcon name={it.icon} className="h-6 w-6" />
                        </span>
                        <p className="mt-3 font-display text-[16px] font-bold">{it.title}</p>
                        {it.text && <p className="mt-1 text-[14px] leading-relaxed opacity-75">{it.text}</p>}
                      </div>
                    ))}
                  </div>,
                  'py-8'
                )}
              </div>
            );
          }

          case 'products': {
            const ids: string[] = Array.isArray(p.productIds) ? p.productIds : [];
            const list = ids.map((id) => byId.get(id)).filter(Boolean) as LandingProduct[];
            if (!list.length) {
              return (
                <div key={block.id}>
                  {shell(block, <Placeholder text="No products chosen for this block yet." />, 'py-5')}
                </div>
              );
            }
            const single = p.layout === 'single' || list.length === 1;
            const cols = Number(p.columns || 3);

            return (
              <div key={block.id}>
                {shell(
                  block,
                  <>
                    {p.heading && (
                      <h2 className="mb-6 text-center font-display text-2xl font-bold sm:text-3xl">{p.heading}</h2>
                    )}
                    <div
                      className={single ? 'mx-auto max-w-md' : 'grid gap-5'}
                      style={single ? undefined : { gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 4 ? 190 : 240}px, 1fr))` }}
                    >
                      {list.map((prod) => (
                        <div key={prod.id} className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
                          {prod.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className={`w-full object-cover ${single ? 'aspect-square' : 'aspect-[4/5]'}`}
                            />
                          )}
                          <div className="p-4 text-left">
                            <p className="font-display text-[15px] font-bold leading-snug">{prod.name}</p>
                            {p.showPrice !== false && (
                              <p className="mt-1.5 flex items-baseline gap-2">
                                <span className="text-[17px] font-bold">{formatPrice(prod.price)}</span>
                                {p.showCompare !== false && prod.comparePrice && prod.comparePrice > prod.price && (
                                  <span className="text-[13px] text-ink-400 line-through">
                                    {formatPrice(prod.comparePrice)}
                                  </span>
                                )}
                              </p>
                            )}
                            {prod.stock <= 0 && (
                              <p className="mt-1 text-[13px] font-semibold text-rose-600">Out of stock</p>
                            )}
                            {p.showBuy !== false && (
                              <a
                                href="#order"
                                className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-brand-600 text-[14px] font-bold text-white transition hover:bg-brand-700"
                              >
                                {p.buyLabel || 'Order now'}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>,
                  'py-8'
                )}
              </div>
            );
          }

          case 'reviews': {
            const items = Array.isArray(p.items) ? p.items : [];
            if (!items.length) {
              return <div key={block.id}>{shell(block, <Placeholder text="No reviews added yet." />, 'py-5')}</div>;
            }
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))` }}
                  >
                    {items.map((r: any, i: number) => (
                      <figure key={i} className="rounded-2xl border border-ink-200 bg-white p-5">
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: Math.max(1, Math.min(5, Number(r.rating) || 5)) }).map((_, s) => (
                            <LandingIcon key={s} name="Star" className="h-4 w-4" />
                          ))}
                        </div>
                        <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-700">{r.text}</blockquote>
                        <figcaption className="mt-3 text-[13px] font-semibold text-ink-500">— {r.name}</figcaption>
                      </figure>
                    ))}
                  </div>,
                  'py-8'
                )}
              </div>
            );
          }

          case 'countdown': {
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <LandingCountdown
                    endsAt={p.endsAt || ''}
                    heading={p.heading}
                    subheading={p.subheading}
                    expiredText={p.expiredText}
                  />,
                  'py-8'
                )}
              </div>
            );
          }

          case 'video': {
            const src = videoEmbedUrl(p.url || '');
            if (!src) {
              return (
                <div key={block.id}>{shell(block, <Placeholder text="Paste a YouTube or Facebook video link." />, 'py-5')}</div>
              );
            }
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl" style={{ aspectRatio: p.ratio || '16/9' }}>
                    <iframe
                      src={src}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      title="Video"
                    />
                  </div>,
                  'py-6'
                )}
              </div>
            );
          }

          case 'html': {
            if (!p.code) {
              return <div key={block.id}>{shell(block, <Placeholder text="This HTML block is empty." />, 'py-5')}</div>;
            }
            // Deliberately raw: the block exists so the merchant can paste embeds
            // and badges the builder cannot express. Only the admin can edit it.
            return (
              <div key={block.id}>
                {shell(block, <div dangerouslySetInnerHTML={{ __html: p.code }} />, 'py-5')}
              </div>
            );
          }

          case 'checkout': {
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <LandingCheckout
                    pageId={pageId}
                    heading={p.heading}
                    subheading={p.subheading}
                    buttonLabel={p.buttonLabel}
                    successText={p.successText}
                    fields={Array.isArray(p.fields) ? p.fields.map((f: any) => (typeof f === 'string' ? f : f.value)) : []}
                    required={Array.isArray(p.required) ? p.required.map((f: any) => (typeof f === 'string' ? f : f.value)) : []}
                    products={products}
                    defaultProductId={products[0]?.id}
                  />,
                  'py-10'
                )}
              </div>
            );
          }

          case 'divider': {
            return (
              <div key={block.id}>
                {shell(
                  block,
                  <hr
                    className="mx-auto border-0"
                    style={{
                      borderTopWidth: p.thickness || 1,
                      borderTopStyle: 'solid',
                      borderTopColor: p.color || '#e7e5e4',
                      width: `${Math.min(100, Math.max(1, Number(p.width) || 100))}%`,
                    }}
                  />,
                  'py-4'
                )}
              </div>
            );
          }

          case 'spacer': {
            return <div key={block.id} style={{ height: Number(p.height) || 48 }} />;
          }

          default:
            return null;
        }
      })}
    </>
  );
}
