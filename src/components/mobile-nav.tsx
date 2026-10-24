"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, ShoppingBag, Users } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

const tabs = [
  // Home is the search box, so one tab covers both.
  {
    href: "/#plan",
    label: "Plan",
    icon: Search,
    match: (p: string) => p === "/",
  },
  {
    href: "/#destinations",
    label: "Explore",
    icon: Compass,
    match: (p: string) =>
      p.startsWith("/destinations") || p.startsWith("/itineraries"),
  },
  {
    href: "/creators",
    label: "Creators",
    icon: Users,
    match: (p: string) => p.startsWith("/creators"),
  },
  {
    href: "/cart",
    label: "Trip",
    icon: ShoppingBag,
    match: (p: string) =>
      p.startsWith("/cart") ||
      p.startsWith("/trip") ||
      p.startsWith("/today") ||
      p.startsWith("/my-trips"),
  },
];

/** Thumb-reach tab bar on phones, where the header has no room for links. */
export function MobileNav() {
  const pathname = usePathname();
  const hydrated = useCartHydrated();
  const count = useCart((s) => s.items.length);
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[1100] border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden print:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-medium text-accent" : "text-muted"}`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
                {href === "/cart" && hydrated && count > 0 && (
                  <span className="absolute top-1 left-1/2 ml-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-background">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
