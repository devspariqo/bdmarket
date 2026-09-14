import type { Metadata } from 'next';
import { getPaymentLogos } from '@/lib/settings';
import PaymentLogoManager from '@/components/admin/PaymentLogoManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Payment Logos' };

export default async function Page() {
  // Falls back to the built-in nine defaults when nothing has been saved yet,
  // so the manager opens populated rather than empty.
  const logos = await getPaymentLogos();

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Payment Logos
        </h1>
        <p className="mt-1 max-w-3xl text-[15px] text-ink-500">
          The brand logos shown in the footer&rsquo;s &ldquo;Accepted Payments&rdquo; grid. Upload the
          official artwork for each method — until you do, a clean typographic badge in the brand
          colour is used instead, so the grid never looks broken.
        </p>
      </header>

      <PaymentLogoManager initial={logos} />
    </div>
  );
}
