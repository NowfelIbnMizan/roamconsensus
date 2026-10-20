"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DestinationTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/destinations/${slug}`, label: "Itineraries" },
    { href: `/destinations/${slug}/esim`, label: "eSIM" },
  ];
  return (
    <nav className="mt-8 mb-8 flex gap-1 border-b border-line" aria-label="Destination sections">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
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
