import type { Metadata } from 'next';
import { CheckCircle2, CreditCard, Percent, Wallet } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber, formatPrice } from '@/lib/utils';
import PaymentMethodManager from '@/components/admin/PaymentMethodManager';

export const metadata: Metadata = { title: 'Payment Methods' };
export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  const methods = await prisma.paymentMethod.findMany({ orderBy: { position: 'asc' } });

  const enabled = methods.filter((m) => m.isEnabled).length;
  const sandbox = methods.filter((m) => m.isSandbox).length;

  // Real volume by method
  const byMethod = await prisma.order.groupBy({
    by: ['paymentMethod'],
    _count: true,
    _sum: { total: true },
  });
  const map = Object.fromEntries(byMethod.map((b) => [b.paymentMethod, b]));

  const codVolume = map.cod?._sum.total || 0;
  const mobileVolume =
    (map.bkash?._sum.total || 0) + (map.nagad?._sum.total || 0) + (map.rocket?._sum.total || 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Sales</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Payment Methods
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Configure bKash, Nagad, Rocket, card and cash-on-delivery. Toggle sandbox mode while you test, then flip to
          live keys when you&apos;re ready to take real payments.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Methods configured" value={formatNumber(methods.length)} icon={CreditCard} tone="bg-brand-50 text-brand-700" />
        <Stat label="Enabled at checkout" value={formatNumber(enabled)} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="In sandbox mode" value={formatNumber(sandbox)} icon={Percent} tone="bg-amber-50 text-amber-700" />
        <Stat
          label="Collected (all time)"
          value={formatPrice((codVolume + mobileVolume) || 0)}
          icon={Wallet}
          tone="bg-blue-50 text-blue-700"
        />
      </div>

      <PaymentMethodManager
        methods={methods.map((m) => {
          const stat = map[m.code];
          return {
            id: m.id,
            code: m.code,
            name: m.name,
            nameBn: m.nameBn,
            description: m.description,
            icon: m.icon,
            instructions: m.instructions,
            isEnabled: m.isEnabled,
            isSandbox: m.isSandbox,
            fee: m.fee,
            feeType: m.feeType,
            config: m.config,
            position: m.position,
            orderCount: stat?._count || 0,
            volume: stat?._sum.total || 0,
          };
        })}
      />
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 truncate font-display text-xl font-bold text-ink-900">{value}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
