import type { Metadata } from 'next';
import { MapPin, Truck, Zap, PackageCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber, formatPrice } from '@/lib/utils';
import ShippingZoneManager from '@/components/admin/ShippingZoneManager';

export const metadata: Metadata = { title: 'Shipping Zones' };
export const dynamic = 'force-dynamic';

export default async function AdminShippingPage() {
  const [zones, shippingSettings] = await Promise.all([
    prisma.shippingZone.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] }),
    prisma.setting.findMany({ where: { group: 'shipping' }, orderBy: { key: 'asc' } }),
  ]);

  const active = zones.filter((z) => z.status === 'active').length;
  const codZones = zones.filter((z) => z.codEnabled).length;
  const avgDays = zones.length
    ? Math.round(zones.reduce((s, z) => s + (z.minDays + z.maxDays) / 2, 0) / zones.length)
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Sales</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Shipping Zones
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Delivery rates by district — Dhaka metro costs less, remote districts cost more. Every district must be
          covered, or it falls back to your default rate.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Zones" value={formatNumber(zones.length)} icon={Truck} tone="bg-brand-50 text-brand-700" />
        <Stat label="Active" value={formatNumber(active)} icon={Zap} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="COD available" value={formatNumber(codZones)} icon={PackageCheck} tone="bg-blue-50 text-blue-700" />
        <Stat label="Avg. delivery" value={`${avgDays} days`} icon={MapPin} tone="bg-amber-50 text-amber-700" />
      </div>

      <ShippingZoneManager
        zones={zones.map((z) => ({
          id: z.id,
          name: z.name,
          districts: z.districts,
          method: z.method,
          rate: z.rate,
          freeOver: z.freeOver,
          minDays: z.minDays,
          maxDays: z.maxDays,
          codEnabled: z.codEnabled,
          status: z.status,
          position: z.position,
        }))}
        settings={shippingSettings.map((s) => ({
          key: s.key,
          value: s.value,
          label: s.label,
          type: s.type,
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
