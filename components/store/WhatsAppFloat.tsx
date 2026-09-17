'use client';

import { MessageCircle, X, Phone } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sticky WhatsApp entry point with a chat-style panel.
 *
 * Three things shape this:
 *
 * 1. **The panel animates both ways.** It used to appear and vanish instantly, so
 *    opening it felt like a glitch rather than a panel. It now scales and fades in
 *    and out; the element stays mounted through the exit, because a CSS transition
 *    needs the node present to animate back.
 *
 * 2. **The header shows the store's own logo**, the way a chat app shows the
 *    business avatar — a generic green circle reads as "some widget", the
 *    merchant's mark reads as "this shop". Falls back to the WhatsApp glyph when
 *    no logo is uploaded, so a store that has not set one still looks deliberate.
 *
 * 3. **A tap toggle everywhere.** A hover-only reveal is useless on touch, which
 *    is what made an earlier version feel broken on phones. The panel renders at
 *    every breakpoint; only the trigger changes shape — a circle on phones, a
 *    labelled pill on desktop.
 *
 * `bottom-[5.5rem]` clears the 56px mobile tab bar plus the home indicator; on
 * desktop there is no tab bar, so `lg:bottom-6` applies.
 */
export default function WhatsAppFloat({
  phone,
  siteName,
  logo = '',
  favicon = '',
}: {
  phone: string;
  siteName: string;
  logo?: string;
  favicon?: string;
}) {
  const [open, setOpen] = useState(false);
  // Kept true for the length of the exit animation so the node can animate out.
  const [mounted, setMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const brand = logo || favicon;
  const digits = phone.replace(/[^\d]/g, '');
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hi ${siteName}, I need help with an order.`
  )}`;

  const show = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setMounted(true);
    // Two frames, so the browser paints the closed state first and the
    // transition has something to animate from. One rAF is not reliably enough —
    // React's commit and the style recalculation can land in the same frame, and
    // the panel then appears already open with no animation.
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    closeTimer.current = setTimeout(() => setMounted(false), 220);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Esc closes, which is expected of anything panel-like.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hide]);

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 z-40 flex flex-col items-end gap-2.5 lg:bottom-6 lg:right-6">
      {mounted && (
        <div
          role="dialog"
          aria-label={`Contact ${siteName} on WhatsApp`}
          aria-hidden={!open}
          className={cn(
            'w-[272px] origin-bottom-right overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop',
            'transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
            open ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-90 opacity-0'
          )}
        >
          {/* Chat header, styled like a messaging app's conversation header. */}
          <div className="bg-[#25D366] px-4 pb-3.5 pt-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-white/40">
                {brand && !logoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand}
                    alt={siteName}
                    className="h-full w-full object-contain p-1"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold leading-tight">{siteName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-white/90">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  Usually replies in 10 minutes
                </p>
              </div>
              <button
                type="button"
                onClick={hide}
                className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/90 transition hover:bg-white/20"
                aria-label="Close WhatsApp panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* A chat bubble, so the panel reads as the start of a conversation
                rather than a marketing card. */}
            <p className="rounded-2xl rounded-tl-sm bg-ink-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-600">
              Hello! Message us about an order, sizing or delivery — we are happy to help.
            </p>

            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={hide}
              className="btn mt-3.5 h-12 w-full bg-[#25D366] text-[15px] font-bold text-white hover:bg-[#1ebe5b]"
            >
              <MessageCircle className="h-[18px] w-[18px]" /> Start chat
            </a>

            <a
              href={`tel:${phone}`}
              onClick={hide}
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
        onClick={() => (open ? hide() : show())}
        className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-pop transition-transform hover:scale-[1.04] active:scale-95 lg:h-auto lg:w-auto lg:gap-2.5 lg:rounded-full lg:px-5 lg:py-3.5"
        aria-label={open ? 'Close WhatsApp contact' : 'Chat on WhatsApp'}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {/* The glyph swaps rather than the button resizing, so the trigger does
            not jump under the pointer mid-tap. */}
        <MessageCircle
          className={cn(
            'h-7 w-7 transition-transform duration-200 motion-reduce:transition-none lg:h-[22px] lg:w-[22px]',
            open ? 'scale-90' : 'scale-100'
          )}
        />
        <span className="hidden whitespace-nowrap text-[15px] font-bold lg:inline">
          {open ? 'Close' : 'Chat with us'}
        </span>
        {!open && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-4 w-4 animate-ping rounded-full bg-[#25D366]/70 motion-reduce:animate-none" />
            <span className="relative h-3.5 w-3.5 rounded-full bg-accent ring-2 ring-white" />
          </span>
        )}
      </button>
    </div>
  );
}
