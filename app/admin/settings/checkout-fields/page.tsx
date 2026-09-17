import type { Metadata } from 'next';
import { getCheckoutFields } from '@/lib/settings';
import CheckoutFieldManager from '@/components/admin/CheckoutFieldManager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Checkout Form' };

export default async function Page() {
  // Falls back to the built-in defaults when nothing has been saved, so the
  // manager opens populated rather than empty.
  const fields = await getCheckoutFields();

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Checkout Form
        </h1>
        <p className="mt-1 max-w-3xl text-[15px] text-ink-500">
          Choose which fields the checkout asks for, what they are called, and which ones a customer
          must fill in. Reorder them with the grip on the left. The order endpoint re-checks the
          required list, so a customer cannot skip a mandatory field by editing the page.
        </p>
      </header>

      <CheckoutFieldManager initial={fields} />
    </div>
  );
}
