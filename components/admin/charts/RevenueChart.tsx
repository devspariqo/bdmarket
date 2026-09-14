'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

export default function RevenueChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
  }));

  const total = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">30-Day Revenue</p>
          <p className="font-display text-xl font-bold text-ink-900">{formatPrice(total)}</p>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Orders</p>
          <p className="font-display text-xl font-bold text-ink-900">{totalOrders}</p>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a355" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#16a355" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
            <XAxis
              dataKey="label" tick={{ fontSize: 10, fill: '#8492aa' }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#8492aa' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12, border: '1px solid #d5dae3', fontSize: 12,
                boxShadow: '0 12px 32px -12px rgba(16,24,40,.18)', padding: '10px 12px',
              }}
              formatter={(value: any, name: string) => [
                name === 'revenue' ? formatPrice(Number(value)) : value,
                name === 'revenue' ? 'Revenue' : 'Orders',
              ]}
              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
            />
            <Area
              type="monotone" dataKey="revenue" stroke="#16a355" strokeWidth={2.5}
              fill="url(#revGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
