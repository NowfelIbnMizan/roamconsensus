"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function DestinationTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  // True while tabs sit past the right edge (phones), so the row fades out there as a "scroll for more" cue.
  const [more, setMore] = useState(false);
  const check = () => {
    const el = nav.current;
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // On phones the row scrolls sideways; keep the open tab in view.
  useEffect(() => {
    const el = nav.current;
    const tab = el?.querySelector<HTMLElement>("[aria-current=page]");
    // Scrolls the row only (scrollIntoView would also scroll the page).
    if (el && tab) el.scrollLeft = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
    check();
  }, [pathname]);
  useEffect(() => {
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const tabs = [
    { href: `/destinations/${slug}`, label: "Routes" },
    { href: `/destinations/${slug}/best`, label: "Top picks" },
    { href: `/destinations/${slug}/stay`, label: "Where to stay" },
    { href: `/destinations/${slug}/when`, label: "When to go" },
    { href: `/destinations/${slug}/before`, label: "Before you go" },
    { href: `/destinations/${slug}/compare`, label: "Compare" },
    { href: `/destinations/${slug}/budget`, label: "Budget" },
    { href: `/destinations/${slug}/esim`, label: "eSIM" },
  ];
  return (
    <nav
      ref={nav}
      onScroll={check}
      // Sideways only: overflow-y-hidden stops the 1px underline offset from making the bar scroll up and down,
      // and the scrollbar is hidden since the cut-off tab already shows there's more.
      className={`relative mt-8 mb-8 flex touch-pan-x gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        more ? "[mask-image:linear-gradient(to_right,black_75%,transparent)]" : ""
      }`}
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

/** The city photo and blurb, on the Routes tab only: other tabs start with their own content near the top. */
export function OverviewOnly({ slug, children }: { slug: string; children: ReactNode }) {
  return usePathname() === `/destinations/${slug}` ? children : null;
}
