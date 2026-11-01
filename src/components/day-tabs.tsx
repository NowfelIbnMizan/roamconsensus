"use client";

import { useEffect, useState } from "react";

/** Day 1, Day 2… bar that sticks under the header; tap jumps to the day, and the day in view lights up. */
export function DayTabs({ days, style = "underline" }: { days: number[]; style?: "underline" | "pill" }) {
  const [active, setActive] = useState(days[0]);

  useEffect(() => {
    const els = days.map((d) => document.getElementById(`day-${d}`)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(Number(seen[0].target.id.slice(4)));
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [days]);

  return (
    <nav
      aria-label="Days"
      className="sticky top-0 z-20 -mx-4 overflow-x-auto bg-background/95 px-4 backdrop-blur [scrollbar-width:none]"
    >
      <ul className={`flex ${style === "pill" ? "gap-2 py-2.5" : "border-b border-line"}`}>
        {days.map((d) => {
          const on = d === active;
          return (
            <li key={d} className={style === "underline" ? "min-w-16 flex-1" : ""}>
              <a
                href={`#day-${d}`}
                aria-current={on ? "true" : undefined}
                className={
                  style === "pill"
                    ? `block rounded-full px-4 py-1.5 text-sm whitespace-nowrap ${on ? "bg-foreground text-background" : "border border-line text-muted"}`
                    : `block border-b-2 px-3 py-3 text-center text-sm whitespace-nowrap ${on ? "border-accent font-semibold text-accent" : "border-transparent text-muted"}`
                }
              >
                Day {d}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
