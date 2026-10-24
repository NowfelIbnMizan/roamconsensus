"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const WIDTH = 288;
const GAP = 8;

/**
 * Shows `card` floating by `children` while a mouse rests on either. Touch and keyboard skip it: the name links to the
 * creator's page, which holds the same things. The card goes in a portal so tilted or clipped parents can't trap it.
 */
export function CreatorHover({ children, card }: { children: React.ReactNode; card: React.ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const show = () => {
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(GAP, Math.min(r.left, window.innerWidth - WIDTH - GAP));
    // Below the name unless that runs off screen and there's more room above.
    const below = window.innerHeight - r.bottom > 280 || r.top < window.innerHeight - r.bottom;
    setPos(below ? { left, top: r.bottom + GAP } : { left, bottom: window.innerHeight - r.top + GAP });
  };
  const hide = () => setPos(null);

  useEffect(() => {
    if (!pos) return;
    const close = () => hide();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("keydown", esc);
    };
  }, [pos]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const enter = (e: React.PointerEvent) => e.pointerType === "mouse" && later(show, 350);
  const leave = () => later(hide, 200);

  return (
    <>
      <span ref={anchor} className="inline-flex" onPointerEnter={enter} onPointerLeave={leave} onClick={hide}>
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ ...pos, width: WIDTH }}
            className="fixed z-50 rounded-2xl border border-line bg-card p-4 text-foreground shadow-xl"
            onPointerEnter={() => clearTimeout(timer.current)}
            onPointerLeave={leave}
          >
            {card}
          </div>,
          document.body,
        )}
    </>
  );
}
