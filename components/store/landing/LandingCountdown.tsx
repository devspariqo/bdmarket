'use client';

import { useEffect, useState } from 'react';

/**
 * Ticking countdown.
 *
 * Renders the full duration on the server pass and only starts counting after
 * mount, so the first paint matches what the HTML said and there is no hydration
 * mismatch from a clock the server and browser disagree about.
 *
 * A deadline in the past shows `expiredText` rather than a negative timer — a
 * page left published past its offer end would otherwise read "-4 days".
 */
export default function LandingCountdown({
  endsAt,
  heading,
  subheading,
  expiredText,
}: {
  endsAt: string;
  heading?: string;
  subheading?: string;
  expiredText?: string;
}) {
  const target = new Date(endsAt).getTime();
  const valid = Number.isFinite(target);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = valid ? Math.max(0, target - (now ?? target)) : 0;
  const expired = valid && now !== null && remaining <= 0;

  const seconds = Math.floor(remaining / 1000);
  const parts = [
    { label: 'Days', value: Math.floor(seconds / 86400) },
    { label: 'Hours', value: Math.floor((seconds % 86400) / 3600) },
    { label: 'Minutes', value: Math.floor((seconds % 3600) / 60) },
    { label: 'Seconds', value: seconds % 60 },
  ];

  return (
    <div className="text-center">
      {heading && <p className="text-[15px] font-bold uppercase tracking-wide opacity-80">{heading}</p>}
      {subheading && <p className="mt-1 text-[15px] opacity-70">{subheading}</p>}

      {!valid ? (
        <p className="mt-3 text-[14px] opacity-60">
          Set an end date for this countdown in the page builder.
        </p>
      ) : expired ? (
        <p className="mt-3 text-[18px] font-bold">{expiredText || 'This offer has ended.'}</p>
      ) : (
        <div className="mt-4 flex justify-center gap-2 sm:gap-3">
          {parts.map((p) => (
            <div
              key={p.label}
              className="min-w-[68px] rounded-xl border border-current/15 bg-black/5 px-3 py-2 backdrop-blur-sm sm:min-w-[80px]"
            >
              <p className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
                {String(p.value).padStart(2, '0')}
              </p>
              <p className="text-[11px] uppercase tracking-wide opacity-70">{p.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
