"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const WIDTH = 288;
const GAP = 8;

type Open = { kind: "hover"; style: React.CSSProperties } | { kind: "sheet" };

/**
 * Shows `card` by `children`: floating beside it while a mouse rests on either, or as a bottom sheet when it's tapped
 * on a touch screen (the tap opens the sheet instead of following the link; the card links on). Keyboard users follow
 * the link to the creator's page, which holds the same things. A portal keeps tilted or clipped parents from trapping it.
 */
export function CreatorHover({
  children,
  card,
  label,
  className = "inline-flex",
}: {
  children: React.ReactNode;
  card: React.ReactNode;
  label: string;
  className?: string;
}) {
  const anchor = useRef<HTMLSpanElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointer = useRef("");
  const [open, setOpen] = useState<Open | null>(null);

  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const hover = () => {
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(GAP, Math.min(r.left, window.innerWidth - WIDTH - GAP));
    // Below the name unless that runs off screen and there's more room above.
    const below = window.innerHeight - r.bottom > 280 || r.top < window.innerHeight - r.bottom;
    setOpen({
      kind: "hover",
      style: below ? { left, top: r.bottom + GAP } : { left, bottom: window.innerHeight - r.top + GAP },
    });
  };
  const close = () => setOpen(null);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    // A floating card would drift from its name on scroll; the sheet stays put.
    if (open.kind === "hover") window.addEventListener("scroll", close, { passive: true });
    else sheet.current?.focus();
    return () => {
      window.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", close);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      <span
        ref={anchor}
        className={className}
        onPointerDown={(e) => (pointer.current = e.pointerType)}
        onPointerEnter={(e) => e.pointerType === "mouse" && later(hover, 350)}
        onPointerLeave={(e) => e.pointerType === "mouse" && later(close, 200)}
        onClickCapture={(e) => {
          if (pointer.current === "touch" || pointer.current === "pen") {
            e.preventDefault();
            setOpen({ kind: "sheet" });
          } else close();
        }}
      >
        {children}
      </span>
      {open?.kind === "hover" &&
        createPortal(
          <div
            role="tooltip"
            style={{ ...open.style, width: WIDTH }}
            className="fixed z-[1150] rounded-2xl border border-line bg-card p-4 text-foreground shadow-xl"
            onPointerEnter={() => clearTimeout(timer.current)}
            onPointerLeave={() => later(close, 200)}
          >
            {card}
          </div>,
          document.body,
        )}
      {open?.kind === "sheet" &&
        createPortal(
          <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/40" onClick={close}>
            <div
              ref={sheet}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-t-3xl border border-line bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground shadow-xl outline-none"
            >
              <span aria-hidden className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line" />
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-muted hover:bg-line"
              >
                <X className="size-4" aria-hidden />
              </button>
              {card}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
