"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function DestinationTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);

  // On phones the row scrolls sideways; keep the open tab in view.
  useEffect(() => {
    const el = nav.current;
    const tab = el?.querySelector<HTMLElement>("[aria-current=page]");
    // Scrolls the row only (scrollIntoView would also scroll the page).
    if (el && tab) el.scrollLeft = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
  }, [pathname]);
  const tabs = [
    { href: `/destinations/${slug}`, label: "Itineraries" },
    { href: `/destinations/${slug}/best`, label: "Top picks" },
    { href: `/destinations/${slug}/when`, label: "When to go" },
    { href: `/destinations/${slug}/before`, label: "Before you go" },
    { href: `/destinations/${slug}/compare`, label: "Compare" },
    { href: `/destinations/${slug}/budget`, label: "Budget" },
    { href: `/destinations/${slug}/esim`, label: "eSIM" },
  ];
  return (
    <nav
      ref={nav}
      // Sideways only: overflow-y-hidden stops the 1px underline offset from making the bar scroll up and down,
      // and the scrollbar is hidden since the cut-off tab already shows there's more.
      className="relative mt-8 mb-8 flex touch-pan-x gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Destination sections"
    >
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
              active ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
