import Link from 'next/link';
import { Star, ShoppingBag, Heart, Eye } from 'lucide-react';
import { formatPrice, discountPercent } from '@/lib/utils';
import AddToCartButton from './AddToCartButton';

export function ProductImage({
  src, alt, className = '', sizes = '(max-width: 768px) 50vw, 25vw', priority = false,
}: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-ink-100 text-ink-300 ${className}`}>
        <ShoppingBag className="h-8 w-8" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={className} sizes={sizes} />
  );
}

export function Stars({ rating, size = 12, className = '' }: { rating: number; size?: number; className?: string }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i < full
              ? 'fill-amber-400 text-amber-400'
              : i === full && half
              ? 'fill-amber-400/50 text-amber-400'
              : 'fill-ink-200 text-ink-200'
          }
        />
      ))}
    </span>
  );
}

function firstImage(images: string) {
  try {
    const a = JSON.parse(images);
    return Array.isArray(a) && a.length ? a[0] : '';
  } catch {
    return '';
  }
}

export type CardProduct = {
  id: string;
  name: string;
  nameBn?: string | null;
  slug: string;
  price: number;
  comparePrice?: number | null;
  images: string;
  rating: number;
  reviewCount: number;
  stock: number;
  soldCount?: number;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  category?: { name: string; slug: string } | null;
  brand?: { name: string; slug: string } | null;
};

export default function ProductCard({ product, compact = false }: { product: CardProduct; compact?: boolean }) {
  const img = firstImage(product.images);
  const discount = discountPercent(product.price, product.comparePrice);
  const outOfStock = product.stock <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-ink-300 hover:shadow-card">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden bg-ink-50">
        <div className={`relative w-full ${compact ? 'aspect-square' : 'aspect-[4/5]'}`}>
          <ProductImage
            src={img}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {discount > 0 && (
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-[12px] font-bold text-accent-on shadow-sm">
              -{discount}%
            </span>
          )}
          {product.newArrival && !discount && (
            <span className="rounded-md bg-ink-900 px-1.5 py-0.5 text-[12px] font-bold text-white shadow-sm">
              NEW
            </span>
          )}
          {product.bestseller && (
            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[12px] font-bold text-white shadow-sm">
              BESTSELLER
            </span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-ink-900 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-white">
              Out of Stock
            </span>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-ink-700 shadow-sm backdrop-blur transition hover:bg-brand-600 hover:text-white">
            <Eye className="h-3.5 w-3.5" />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-ink-700 shadow-sm backdrop-blur transition hover:bg-brand-600 hover:text-white">
            <Heart className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5">
        {product.brand && (
          <p className="mb-1 text-[12px] font-bold uppercase tracking-wider text-ink-400">
            {product.brand.name}
          </p>
        )}

        <Link href={`/product/${product.slug}`} className="flex-1">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink-900 transition group-hover:text-brand-700 sm:text-[15px]">
            {product.name}
          </h3>
          {product.nameBn && (
            <p className="bn mt-0.5 line-clamp-1 text-[12px] text-ink-400">{product.nameBn}</p>
          )}
        </Link>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Stars rating={product.rating} />
          <span className="text-[12px] text-ink-400">
            {product.rating.toFixed(1)}
            {product.reviewCount > 0 && ` (${product.reviewCount})`}
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-bold text-ink-900 sm:text-[17px]">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && product.comparePrice && (
              <span className="text-[12px] text-ink-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          {(product.soldCount ?? 0) > 50 && (
            <span className="text-[12px] font-medium text-ink-400">{product.soldCount} sold</span>
          )}
        </div>

        <div className="mt-3">
          <AddToCartButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            image={img}
            stock={product.stock}
            compact
          />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white">
          <div className="skeleton aspect-[4/5] w-full rounded-none" />
          <div className="space-y-2 p-3.5">
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
