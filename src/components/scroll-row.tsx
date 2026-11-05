"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** A sideways-scrolling row with arrow buttons for mouse users; phones keep plain swiping. */
export function ScrollRow({ children, className = "", label }: { children: ReactNode; className?: string; label: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const arrow = (dir: 1 | -1, hidden: boolean) => (
    <button
      type="button"
      onClick={() => move(dir)}
      aria-label={dir === 1 ? `Next ${label}` : `Previous ${label}`}
      className={`absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-card text-foreground shadow-md hover:border-accent hover:text-accent [@media(hover:hover)]:flex ${dir === 1 ? "-right-2" : "-left-2"} ${hidden ? "pointer-events-none !hidden" : ""}`}
    >
      {dir === 1 ? <ChevronRight className="size-5" aria-hidden /> : <ChevronLeft className="size-5" aria-hidden />}
    </button>
  );

  return (
    <div className="relative">
      <div ref={row} className={className}>
        {children}
      </div>
      {arrow(-1, edges.start)}
      {arrow(1, edges.end)}
    </div>
  );
}
