import { cn } from '@/lib/utils';
import type { PaymentLogo } from '@/lib/payment-logos';

/**
 * The built-in fallback mark for a payment method: a typographic badge in the
 * brand's colour.
 *
 * Deliberately NOT a reproduction of any official logo — these are trademarks,
 * and a hand-drawn approximation would look wrong at small sizes and misrepresent
 * the brand. The merchant uploads the real artwork; until then this reads as an
 * intentional design choice rather than a missing image.
 *
 * No `'use client'` here on purpose: the footer is a server component and needs
 * to render this without shipping it to the browser, while the admin manager
 * (a client component) imports the same file.
 */
export function PaymentMark({
  label,
  mark,
  color,
  small = false,
}: {
  label: string;
  mark: string;
  color: string;
  small?: boolean;
}) {
  const text = (mark || label || '?').slice(0, 8);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-bold tracking-tight text-white',
        small ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-[13px]'
      )}
      style={{ background: color }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/**
 * One tile's contents: the uploaded logo when present, otherwise the fallback
 * mark. Used by the storefront footer and the admin preview so both show the
 * exact same thing.
 */
export function PaymentBadge({
  method,
  imgClassName = 'max-h-8 max-w-full object-contain',
}: {
  method: PaymentLogo;
  imgClassName?: string;
}) {
  if (method.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={method.logo} alt={method.label} className={imgClassName} loading="lazy" />
    );
  }
  return <PaymentMark label={method.label} mark={method.mark} color={method.color} small />;
}
