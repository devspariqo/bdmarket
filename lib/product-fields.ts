import type { Prisma } from '@prisma/client';

/**
 * The product columns a grid card actually renders.
 *
 * Every product listing used to `findMany()` with no `select`, which pulls all
 * ~44 columns — including `description`, `shortDesc`, `variants`, `attributes`,
 * `careInstructions` and the SEO fields. None of that is used by a card, but all
 * of it is serialised into the RSC payload and shipped to the browser, which is
 * why the homepage HTML ran to roughly 450 KB.
 *
 * Keep this in step with `CardProduct` in `components/store/ProductCard.tsx`:
 * TypeScript will flag any page that selects too little for the card it renders,
 * but nothing will flag a field that is selected and never used.
 */
export const CARD_PRODUCT_SELECT = {
  id: true,
  name: true,
  nameBn: true,
  slug: true,
  price: true,
  comparePrice: true,
  images: true,
  rating: true,
  reviewCount: true,
  stock: true,
  soldCount: true,
  featured: true,
  bestseller: true,
  newArrival: true,
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;
