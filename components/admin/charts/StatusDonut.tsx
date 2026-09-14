'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ORDER_STATUS_LABEL } from '@/lib/utils';

const COLORS: Record<string, string> = {
  PENDING: '#f4b400',
  PROCESSING: '#3b82f6',
  CONFIRMED: '#6366f1',
  PACKED: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#16a355',
  CANCELLED: '#f43f5e',
  RETURNED: '#f97316',
  REFUNDED: '#64748b',
};

export default function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    name: ORDER_STATUS_LABEL[d.status] || d.status,
    value: d.count,
    key: d.status,
  }));

  const total = chartData.reduce((s, d) => s + d.value, 0);

  if (!total) {
    return <p className="py-16 text-center text-[13px] text-ink-400">No order data yet</p>;
  }

  return (
    <div>
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" innerRadius={54} outerRadius={82}
              paddingAngle={2} strokeWidth={0}
            >
              {chartData.map((d) => (
                <Cell key={d.key} fill={COLORS[d.key] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #d5dae3', fontSize: 12, padding: '8px 10px' }}
              formatter={(v: any, n: string) => [`${v} orders`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-2xl font-bold text-ink-900">{total}</p>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">Orders</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {chartData
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
          .map((d) => (
            <div key={d.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[d.key] || '#94a3b8' }} />
              <span className="flex-1 truncate text-[12px] text-ink-600">{d.name}</span>
              <span className="text-[12px] font-bold text-ink-900">{d.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
