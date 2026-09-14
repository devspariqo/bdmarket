'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

export default function CategoryBar({
  data,
}: { data: { id: string; name: string; sold: number; revenue: number }[] }) {
  if (!data.length) return <p className="py-12 text-center text-[13px] text-ink-400">No category data yet</p>;

  const chartData = data.map((d) => ({ ...d, short: d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name }));

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
          <XAxis dataKey="short" tick={{ fontSize: 10, fill: '#8492aa' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#8492aa' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #d5dae3', fontSize: 12, padding: '10px 12px' }}
            formatter={(v: any) => [formatPrice(Number(v)), 'Revenue']}
            labelFormatter={(l: string) => `Category: ${l}`}
            cursor={{ fill: 'rgba(22,163,85,.06)' }}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={46}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={['#16a355', '#22c56c', '#4ade8b', '#86efb3', '#bbf7d3', '#dcfce9'][i % 6]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
