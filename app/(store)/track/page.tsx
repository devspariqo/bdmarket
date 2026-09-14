import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Package, Search, Truck, MapPin, ShieldCheck, Headphones, ChevronRight,
  Clock, CheckCircle2,
} from 'lucide-react';
import TrackForm from '@/components/store/TrackForm';
import { getSiteConfig } from '@/lib/settings';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description:
    'Track your BD Market order status in real time. Enter your order number to see packing, courier and delivery updates.',
};

export const dynamic = 'force-dynamic';

const STEPS = [
  { icon: CheckCircle2, title: 'Order placed', body: 'You get a confirmation call and an SMS with your order number.' },
  { icon: Package, title: 'Packed & verified', body: 'We check every item and seal the parcel at our Dhaka warehouse.' },
  { icon: Truck, title: 'Handed to courier', body: 'A tracking number is added to your order page once it ships.' },
  { icon: MapPin, title: 'Delivered to you', body: 'Pay cash on delivery, or pre-pay with bKash / Nagad.' },
];

export default async function TrackPage() {
  const config = await getSiteConfig();

  return (
    <div className="bg-ink-50/50">
      {/* Hero */}
      <section className="border-b border-ink-200 bg-white">
        <div className="container-x py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-ink-500">
            <Link href="/" className="transition hover:text-brand-700">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
            <span className="font-semibold text-ink-800">Track Order</span>
          </nav>

          <div className="mt-5 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-brand-700">
              <Truck className="h-3.5 w-3.5" /> Order Tracking
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Where is my order?
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-500">
              Enter the order number from your confirmation SMS or email. You will see the live
              status, courier details and every step your parcel has passed through.
            </p>
          </div>

          <div className="mt-6 max-w-2xl">
            <TrackForm />
          </div>

          <p className="mt-4 text-[14px] text-ink-500">
            Lost your order number?{' '}
            <Link href="/login" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              Sign in
            </Link>{' '}
            to see all of your orders, or{' '}
            <a href={`tel:${config.phone}`} className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              call {config.phone}
            </a>
            .
          </p>
        </div>
      </section>

      <div className="container-x py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_330px]">
          {/* How it works */}
          <section>
            <h2 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
              How delivery works
            </h2>
            <p className="mt-1.5 text-[15px] text-ink-500">
              Typical delivery time is 2–4 days inside Dhaka and 3–6 days outside Dhaka.
            </p>

            <ol className="mt-6 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="card flex gap-4 p-4 sm:p-5">
                  <div className="flex flex-col items-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <s.icon className="h-5 w-5" />
                    </span>
                    {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-ink-200" />}
                  </div>
                  <div className="min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-ink-400">
                        Step {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-[16px] font-bold text-ink-900">{s.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-ink-500">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <section className="card p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
                <Search className="h-4 w-4 text-brand-600" /> Finding your number
              </h2>
              <ul className="mt-3 space-y-2.5 text-[14px] text-ink-600">
                <li className="flex gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  <span>SMS and email arrive within 5 minutes of ordering.</span>
                </li>
                <li className="flex gap-2.5">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  <span>It looks like <strong className="font-mono text-[13px]">BD26091001</strong>.</span>
                </li>
                <li className="flex gap-2.5">
                  <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                  <span>
                    Still stuck? WhatsApp{' '}
                    <a
                      href={`https://wa.me/${config.whatsapp.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-700"
                    >
                      {config.whatsapp}
                    </a>
                  </span>
                </li>
              </ul>
            </section>

            <section className="card bg-ink-900 p-5 text-white">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <ShieldCheck className="h-4 w-4 text-brand-300" /> Shop with confidence
              </h2>
              <ul className="mt-3 space-y-2 text-[14px] text-white/80">
                <li>Cash on delivery nationwide</li>
                <li>7-day easy return on unused items</li>
                <li>Free delivery on orders over ৳{config.freeShippingOver}</li>
              </ul>
              <Link href="/shop" className="btn mt-4 w-full bg-white text-ink-900 hover:bg-ink-100">
                Continue shopping
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
