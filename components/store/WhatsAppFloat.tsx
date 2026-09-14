'use client';

import { MessageCircle, X, Phone } from 'lucide-react';
import { useState } from 'react';

/**
 * Sticky WhatsApp entry point.
 *
 * Design notes (why it looks like this):
 * - Hover-only reveals are useless on touch, which is what made the old version
 *   feel broken on phones, so the trigger is a tap toggle everywhere.
 * - The panel used to be `lg:hidden`, so on desktop the button toggled state and
 *   *nothing appeared*. The panel now renders at every breakpoint; only the
 *   trigger changes shape (56px circle on phones, labelled pill on desktop).
 * - `bottom-[5.5rem]` clears the 56px mobile tab bar plus the home indicator;
 *   on desktop there is no tab bar so `lg:bottom-6` applies.
 */
export default function WhatsAppFloat({ phone, siteName }: { phone: string; siteName: string }) {
  const [open, setOpen] = useState(false);
  const digits = phone.replace(/[^\d]/g, '');
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${siteName}, I need help with an order.`
  )}`;

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 z-40 flex flex-col items-end gap-2.5 lg:bottom-6 lg:right-6">
      {/* Contact card — phones and desktop */}
      {open && (
        <div className="w-[260px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop animate-[fade-up_.2s_ease]">
          <div className="flex items-start justify-between gap-3 bg-[#25D366] px-4 py-3.5 text-white">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wider text-white/85">
                WhatsApp support
              </p>
              <p className="mt-0.5 truncate text-[16px] font-bold">{siteName}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/20"
              aria-label="Close WhatsApp panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-[13px] leading-relaxed text-ink-500">
              Message us about an order, sizing or delivery. We usually reply inside 10 minutes
              during business hours.
            </p>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="btn mt-3.5 h-12 w-full bg-[#25D366] text-[15px] font-bold text-white hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="h-[18px] w-[18px]" /> Start chat
            </a>

            <a
              href={`tel:${phone}`}
              onClick={() => setOpen(false)}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 text-[14px] font-semibold text-ink-700 transition hover:bg-ink-50"
            >
              <Phone className="h-4 w-4" /> Call {phone}
            </a>
          </div>
        </div>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-pop transition-transform hover:scale-[1.04] active:scale-95 lg:h-auto lg:w-auto lg:gap-2.5 lg:rounded-full lg:px-5 lg:py-3.5"
        aria-label={open ? 'Close WhatsApp contact' : 'Chat on WhatsApp'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MessageCircle className="h-7 w-7 lg:h-[22px] lg:w-[22px]" />
        <span className="hidden whitespace-nowrap text-[15px] font-bold lg:inline">Chat with us</span>
        {!open && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-4 w-4 animate-ping rounded-full bg-[#25D366]/70" />
            <span className="relative h-3.5 w-3.5 rounded-full bg-accent ring-2 ring-white" />
          </span>
        )}
      </button>
    </div>
  );
}
