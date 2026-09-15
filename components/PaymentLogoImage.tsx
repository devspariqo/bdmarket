import type { PaymentLogo } from '@/lib/payment-logos';

/**
 * A payment method's uploaded logo — the only thing the storefront draws for it.
 *
 * Returns `null` when no artwork has been uploaded. That is deliberate: the
 * footer grid and the product page's "Payment Options" block show logos only,
 * so there is nothing meaningful to render without one. `uploadedPaymentLogos()`
 * in `lib/payment-logos.ts` filters those rows out before they reach a grid, so
 * this normally only fires for a method added seconds ago in the admin.
 *
 * No `'use client'` here on purpose: the footer and the product page are server
 * components and render this without shipping it to the browser, while the admin
 * manager (a client component) imports the same file.
 */
export function PaymentLogoImage({
  method,
  className = 'max-h-8 max-w-full object-contain',
}: {
  method: PaymentLogo;
  className?: string;
}) {
  if (!method.logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={method.logo} alt={method.label} className={className} loading="lazy" />
  );
}
