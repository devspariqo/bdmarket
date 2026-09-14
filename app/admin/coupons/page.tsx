import type { Metadata } from 'next';
import { Percent, Ticket, TrendingUp, Ban } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber, formatPrice, formatDate } from '@/lib/utils';
import CouponManager from '@/components/admin/CouponManager';

export const metadata: Metadata = { title: 'Coupons' };
export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  const now = new Date();
  const active = coupons.filter(
    (c) => c.status === 'active' && (!c.expiresAt || c.expiresAt > now)
  ).length;
  const expired = coupons.filter((c) => c.expiresAt && c.expiresAt < now).length;
  const totalRedemptions = coupons.reduce((s, c) => s + c.usedCount, 0);

  // Revenue influenced by coupons on real orders
  const couponOrders = await prisma.order.aggregate({
    where: { couponCode: { not: null } },
    _sum: { discount: true, total: true },
    _count: true,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Sales</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Coupons</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Percentage, fixed-amount and free-shipping discounts with per-customer limits and expiry windows.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active coupons" value={formatNumber(active)} icon={Ticket} tone="bg-brand-50 text-brand-700" />
        <Stat label="Total redemptions" value={formatNumber(totalRedemptions)} icon={Percent} tone="bg-blue-50 text-blue-700" />
        <Stat
          label="Discount given"
          value={formatPrice(couponOrders._sum.discount || 0)}
          icon={TrendingUp}
          tone="bg-amber-50 text-amber-700"
        />
        <Stat label="Expired" value={formatNumber(expired)} icon={Ban} tone="bg-ink-100 text-ink-600" />
      </div>

      <CouponManager
        initial={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          type: c.type,
          value: c.value,
          minOrder: c.minOrder,
          maxDiscount: c.maxDiscount,
          usageLimit: c.usageLimit,
          usedCount: c.usedCount,
          perCustomer: c.perCustomer,
          startsAt: c.startsAt ? c.startsAt.toISOString().slice(0, 10) : '',
          expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : '',
          status: c.status,
        }))}
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
