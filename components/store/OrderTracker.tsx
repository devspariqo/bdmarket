'use client';

import { Check } from 'lucide-react';

export default function OrderTracker({
  steps, current,
}: { steps: { key: string; label: string }[]; current: number }) {
  return (
    <div className="relative">
      {/* Desktop horizontal */}
      <div className="hidden sm:block">
        <div className="relative flex justify-between">
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-ink-200" />
          <div
            className="absolute left-0 top-5 h-0.5 bg-brand-600 transition-all duration-700"
            style={{ width: `${(Math.max(0, current) / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s, i) => (
            <div key={s.key} className="relative z-10 flex flex-1 flex-col items-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all ${
                  i <= current ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-400'
                }`}
              >
                {i < current ? <Check className="h-5 w-5" /> : <span className="text-[13px] font-bold">{i + 1}</span>}
              </span>
              <span className={`mt-2 text-center text-[12px] font-semibold ${i <= current ? 'text-ink-900' : 'text-ink-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile vertical */}
      <ol className="space-y-4 sm:hidden">
        {steps.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                i <= current ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-400'
              }`}
            >
              {i < current ? <Check className="h-4 w-4" /> : <span className="text-[12px] font-bold">{i + 1}</span>}
            </span>
            <span className={`text-sm font-semibold ${i <= current ? 'text-ink-900' : 'text-ink-400'}`}>
              {s.label}
            </span>
            {i === current && (
              <span className="ml-auto rounded-full bg-brand-100 px-2.5 py-1 text-[12px] font-bold text-brand-800">
                CURRENT
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
