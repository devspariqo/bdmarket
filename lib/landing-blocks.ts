/**
 * The landing-page block library.
 *
 * A landing page is a JSON array of blocks stored in `LandingPage.blocks`. This
 * module is the single definition of what a block is: its type, its default
 * props, and the fields the admin editor should show for it. The admin builder
 * and the public renderer both read from here, so adding a block type means
 * touching this file and the two switch statements that consume it — and the
 * editor form is generated from `fields`, so a new prop needs no new UI code.
 *
 * Deliberately framework-free: no React, no icons. It is imported by a server
 * component (the renderer) and a client component (the builder), and by the
 * order endpoint, which reads the checkout block's field list.
 */

export type BlockType =
  | 'hero'
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'features'
  | 'products'
  | 'reviews'
  | 'countdown'
  | 'video'
  | 'html'
  | 'checkout'
  | 'divider'
  | 'spacer';

/** Per-block presentation, kept separate from content so a style change never
 *  risks the copy. */
export type BlockStyle = {
  /** Background. Empty means transparent — the page background shows through. */
  bg?: string;
  color?: string;
  paddingY?: number;
  align?: 'left' | 'center' | 'right';
  /** Constrain the block narrower than the page (px). 0 = full page width. */
  maxWidth?: number;
  radius?: number;
};

export type Block = {
  /** Stable id so React keys and drag targets survive reordering. */
  id: string;
  type: BlockType;
  props: Record<string, any>;
  style?: BlockStyle;
};

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'image'
  | 'products'
  | 'list';

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  /** For `list`: the shape of one row. */
  itemFields?: { key: string; label: string; type: FieldType }[];
};

export type BlockDef = {
  label: string;
  /** One line shown in the add-block palette. */
  hint: string;
  /** lucide-react icon name, mapped in the builder. */
  icon: string;
  defaults: () => Record<string, any>;
  fields: FieldDef[];
};

const ALIGN: FieldDef = {
  key: '__align',
  label: 'Alignment',
  type: 'select',
  options: [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Centre' },
    { value: 'right', label: 'Right' },
  ],
};

export const BLOCKS: Record<BlockType, BlockDef> = {
  hero: {
    label: 'Hero',
    hint: 'Full-width image with a headline and call to action',
    icon: 'Image',
    defaults: () => ({
      image: '',
      heading: 'Your headline here',
      subheading: 'A short line that explains the offer.',
      ctaLabel: 'Order now',
      ctaHref: '#order',
      overlay: 45,
      height: 520,
      align: 'center',
    }),
    fields: [
      { key: 'image', label: 'Background image', type: 'image' },
      { key: 'heading', label: 'Headline', type: 'text' },
      { key: 'subheading', label: 'Sub-headline', type: 'textarea' },
      { key: 'ctaLabel', label: 'Button label', type: 'text' },
      { key: 'ctaHref', label: 'Button link', type: 'text', help: 'Use #order to scroll to the checkout block.' },
      { key: 'overlay', label: 'Dark overlay (%)', type: 'number', help: 'Improves text contrast over a busy photo.' },
      { key: 'height', label: 'Height (px)', type: 'number' },
      ALIGN,
    ],
  },

  heading: {
    label: 'Heading',
    hint: 'A section title',
    icon: 'Heading',
    defaults: () => ({ text: 'Section heading', level: 'h2', align: 'left' }),
    fields: [
      { key: 'text', label: 'Text', type: 'text' },
      {
        key: 'level',
        label: 'Size',
        type: 'select',
        options: [
          { value: 'h1', label: 'Extra large' },
          { value: 'h2', label: 'Large' },
          { value: 'h3', label: 'Medium' },
          { value: 'h4', label: 'Small' },
        ],
        help: 'Use one h1 per page — it is what search engines read as the page title.',
      },
      ALIGN,
    ],
  },

  text: {
    label: 'Text',
    hint: 'A paragraph. Line breaks are preserved',
    icon: 'Type',
    defaults: () => ({ text: 'Describe the product, the offer, or why it is worth buying.', align: 'left', size: 'base' }),
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', help: 'Blank lines start a new paragraph.' },
      {
        key: 'size',
        label: 'Size',
        type: 'select',
        options: [
          { value: 'sm', label: 'Small' },
          { value: 'base', label: 'Normal' },
          { value: 'lg', label: 'Large' },
        ],
      },
      ALIGN,
    ],
  },

  image: {
    label: 'Image',
    hint: 'A single image, optionally clickable',
    icon: 'ImagePlus',
    defaults: () => ({ src: '', alt: '', href: '', width: 0, align: 'center', radius: 12 }),
    fields: [
      { key: 'src', label: 'Image', type: 'image' },
      { key: 'alt', label: 'Alt text', type: 'text', help: 'Describes the image for screen readers and search engines.' },
      { key: 'href', label: 'Link (optional)', type: 'text' },
      { key: 'width', label: 'Max width (px)', type: 'number', help: '0 fills the content width.' },
      { key: 'radius', label: 'Corner radius (px)', type: 'number' },
      ALIGN,
    ],
  },

  button: {
    label: 'Button',
    hint: 'A call to action',
    icon: 'MousePointerClick',
    defaults: () => ({ label: 'Order now', href: '#order', bg: '#0f766e', color: '#ffffff', size: 'lg', align: 'center', fullWidth: false }),
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'href', label: 'Link', type: 'text' },
      { key: 'bg', label: 'Background', type: 'color' },
      { key: 'color', label: 'Text colour', type: 'color' },
      {
        key: 'size',
        label: 'Size',
        type: 'select',
        options: [
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
        ],
      },
      { key: 'fullWidth', label: 'Full width', type: 'boolean' },
      ALIGN,
    ],
  },

  features: {
    label: 'Feature list',
    hint: 'Icon, title and text — good for benefits',
    icon: 'ListChecks',
    defaults: () => ({
      items: [
        { icon: 'Truck', title: 'Cash on delivery', text: 'Pay when it arrives.' },
        { icon: 'ShieldCheck', title: '7-day returns', text: 'Changed your mind? Send it back.' },
        { icon: 'Headphones', title: 'Support', text: 'Call us on the hotline.' },
      ],
      columns: 3,
      align: 'center',
    }),
    fields: [
      {
        key: 'items',
        label: 'Items',
        type: 'list',
        itemFields: [
          { key: 'icon', label: 'Icon', type: 'text' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
        help: 'Icon names come from lucide.dev, e.g. Truck, ShieldCheck, Star.',
      },
      {
        key: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { value: '2', label: 'Two' },
          { value: '3', label: 'Three' },
          { value: '4', label: 'Four' },
        ],
      },
      ALIGN,
    ],
  },

  products: {
    label: 'Products',
    hint: 'One product, or a grid of them, with buy buttons',
    icon: 'ShoppingBag',
    defaults: () => ({
      productIds: [],
      layout: 'grid',
      columns: 3,
      showPrice: true,
      showCompare: true,
      showBuy: true,
      buyLabel: 'Order now',
      heading: '',
    }),
    fields: [
      {
        key: 'productIds',
        label: 'Products',
        type: 'products',
        help: 'Pick one product for a single-product funnel, or several for a collection.',
      },
      { key: 'heading', label: 'Heading above (optional)', type: 'text' },
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'grid', label: 'Grid' },
          { value: 'single', label: 'One large product' },
        ],
      },
      {
        key: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { value: '2', label: 'Two' },
          { value: '3', label: 'Three' },
          { value: '4', label: 'Four' },
        ],
      },
      { key: 'showPrice', label: 'Show price', type: 'boolean' },
      { key: 'showCompare', label: 'Show crossed-out price', type: 'boolean' },
      { key: 'showBuy', label: 'Show buy button', type: 'boolean' },
      { key: 'buyLabel', label: 'Buy button label', type: 'text' },
    ],
  },

  reviews: {
    label: 'Reviews',
    hint: 'Customer quotes',
    icon: 'Quote',
    defaults: () => ({
      items: [
        { name: 'Ayesha R.', text: 'Arrived the next day and the quality is excellent.', rating: 5 },
        { name: 'Tanvir H.', text: 'Exactly as described. Will order again.', rating: 5 },
      ],
      columns: 2,
    }),
    fields: [
      {
        key: 'items',
        label: 'Reviews',
        type: 'list',
        itemFields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'text', label: 'Review', type: 'textarea' },
          { key: 'rating', label: 'Stars (1-5)', type: 'number' },
        ],
        help: 'Use reviews you actually received. Publishing invented ones misleads customers.',
      },
      {
        key: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { value: '1', label: 'One' },
          { value: '2', label: 'Two' },
          { value: '3', label: 'Three' },
        ],
      },
    ],
  },

  countdown: {
    label: 'Countdown',
    hint: 'A deadline — used for offers and launches',
    icon: 'Timer',
    defaults: () => ({ endsAt: '', heading: 'Offer ends in', subheading: '', expiredText: 'This offer has ended.' }),
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Sub-heading', type: 'text' },
      {
        key: 'endsAt',
        label: 'Ends at',
        type: 'text',
        placeholder: '2026-12-31T23:59',
        help: 'Date and time in your store timezone, e.g. 2026-12-31T23:59.',
      },
      { key: 'expiredText', label: 'Text once ended', type: 'text' },
    ],
  },

  video: {
    label: 'Video',
    hint: 'YouTube or Facebook embed',
    icon: 'Play',
    defaults: () => ({ url: '', ratio: '16/9' }),
    fields: [
      { key: 'url', label: 'Video URL', type: 'text', help: 'Paste the normal watch/share link — it is converted to an embed automatically.' },
      {
        key: 'ratio',
        label: 'Aspect ratio',
        type: 'select',
        options: [
          { value: '16/9', label: 'Widescreen (16:9)' },
          { value: '4/3', label: 'Classic (4:3)' },
          { value: '1/1', label: 'Square (1:1)' },
          { value: '9/16', label: 'Vertical (9:16)' },
        ],
      },
    ],
  },

  html: {
    label: 'HTML',
    hint: 'Raw HTML — embeds, badges, anything custom',
    icon: 'Code',
    defaults: () => ({ code: '<div style="padding:16px;text-align:center">Your HTML here</div>' }),
    fields: [
      {
        key: 'code',
        label: 'HTML',
        type: 'textarea',
        help: 'Inserted as-is. Scripts run, so only paste code you trust.',
      },
    ],
  },

  checkout: {
    label: 'Checkout form',
    hint: 'The order form — name, phone, address, place order',
    icon: 'CreditCard',
    defaults: () => ({
      heading: 'Order now',
      subheading: 'Cash on delivery. We will call to confirm.',
      buttonLabel: 'Place order',
      successText: 'Thank you! We have received your order and will call you shortly.',
      fields: ['customerName', 'phone', 'district', 'street'],
      required: ['customerName', 'phone', 'district', 'street'],
    }),
    fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subheading', label: 'Sub-heading', type: 'textarea' },
      { key: 'buttonLabel', label: 'Button label', type: 'text' },
      { key: 'successText', label: 'Message after ordering', type: 'textarea' },
      {
        key: 'fields',
        label: 'Fields to show',
        type: 'list',
        itemFields: [{ key: 'value', label: 'Field key', type: 'text' }],
        help: 'customerName, phone, email, division, district, area, street, postcode, customerNote',
      },
      {
        key: 'required',
        label: 'Required fields',
        type: 'list',
        itemFields: [{ key: 'value', label: 'Field key', type: 'text' }],
      },
    ],
  },

  divider: {
    label: 'Divider',
    hint: 'A horizontal rule',
    icon: 'Minus',
    defaults: () => ({ color: '#e7e5e4', thickness: 1, width: 100 }),
    fields: [
      { key: 'color', label: 'Colour', type: 'color' },
      { key: 'thickness', label: 'Thickness (px)', type: 'number' },
      { key: 'width', label: 'Width (%)', type: 'number' },
    ],
  },

  spacer: {
    label: 'Spacer',
    hint: 'Vertical breathing room',
    icon: 'MoveVertical',
    defaults: () => ({ height: 48 }),
    fields: [{ key: 'height', label: 'Height (px)', type: 'number' }],
  },
};

export const BLOCK_ORDER: BlockType[] = [
  'hero',
  'heading',
  'text',
  'image',
  'button',
  'features',
  'products',
  'checkout',
  'reviews',
  'countdown',
  'video',
  'html',
  'divider',
  'spacer',
];

/** Every order form field a landing page may collect. */
export const CHECKOUT_FIELDS: { key: string; label: string; placeholder?: string }[] = [
  { key: 'customerName', label: 'Full name', placeholder: 'Your name' },
  { key: 'phone', label: 'Mobile number', placeholder: '01712345678' },
  { key: 'email', label: 'Email', placeholder: 'you@example.com' },
  { key: 'division', label: 'Division' },
  { key: 'district', label: 'District' },
  { key: 'area', label: 'Area', placeholder: 'Area or thana' },
  { key: 'street', label: 'Address', placeholder: 'House, road, landmark' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'customerNote', label: 'Order note', placeholder: 'Anything we should know?' },
];

/** A fresh block of the given type, with a stable id. */
export function newBlock(type: BlockType): Block {
  return {
    id: `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    type,
    props: BLOCKS[type].defaults(),
    style: {},
  };
}

/**
 * Parse stored JSON into blocks, tolerating anything malformed.
 *
 * A landing page that fails to parse must still render its other blocks rather
 * than 500 — the same reasoning as `parseJSON` elsewhere in the app, which exists
 * because a truncated value once took whole pages down.
 */
export function parseBlocks(raw: unknown): Block[] {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  return value
    .filter((b): b is Block => !!b && typeof b === 'object' && typeof (b as Block).type === 'string')
    .filter((b) => b.type in BLOCKS)
    .map((b, i) => ({
      id: typeof b.id === 'string' && b.id ? b.id : `b${i}`,
      type: b.type,
      props: b.props && typeof b.props === 'object' ? b.props : BLOCKS[b.type].defaults(),
      style: b.style && typeof b.style === 'object' ? b.style : {},
    }));
}

/** The checkout block on a page, if it has one. */
export function findCheckoutBlock(blocks: Block[]): Block | undefined {
  return blocks.find((b) => b.type === 'checkout');
}

/** Turn a video watch/share URL into an embed URL. Returns '' if unrecognised. */
export function videoEmbedUrl(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return '';

  const yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const fb = raw.match(/facebook\.com\/.+\/videos\/(\d+)/);
  if (fb) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}`;

  const vimeo = raw.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // Already an embed, or something we do not recognise but can still frame.
  if (/^https?:\/\//.test(raw)) return raw;
  return '';
}

/** Build the public path for a page. */
export function landingPath(parentSlug: string, slug: string): string {
  const parent = (parentSlug || 'collection').replace(/^\/+|\/+$/g, '');
  const child = (slug || '').replace(/^\/+|\/+$/g, '');
  return `/${parent}/${child}`;
}
