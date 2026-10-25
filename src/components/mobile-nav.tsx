"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, Map, Search, ShoppingBag, Sun, Users } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { useTripDay } from "@/lib/use-trip-day";

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
];

const tripMatch = (p: string) =>
  p.startsWith("/cart") ||
  p.startsWith("/trip") ||
  p.startsWith("/today") ||
  p.startsWith("/my-trips");

const tabClass = (active: boolean) =>
  `relative flex w-full flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-medium text-accent" : "text-muted"}`;

/**
 * Thumb-reach tab bar on phones, where the header has no room for links. The Trip tab opens a small menu, so the cart,
 * Trip mode and saved trips are each one tap away.
 */
export function MobileNav({ accounts }: { accounts: boolean }) {
  const pathname = usePathname();
  const hydrated = useCartHydrated();
  const count = useCart((s) => s.items.length);
  const today = useTripDay();
  const [open, setOpen] = useState(false);

  // A link in the menu, or the back button, closes it.
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  const menu = [
    {
      href: "/cart",
      label: "Trip cart",
      sub:
        hydrated && count > 0
          ? `${count} ${count === 1 ? "stop" : "stops"} · days and budget`
          : "Stops you have saved",
      icon: ShoppingBag,
    },
    {
      href: "/today",
      label: "Trip mode",
      sub: today
        ? `Day ${today} is today: your next stop`
        : "Your plan day by day, while you travel",
      icon: Sun,
    },
    ...(accounts
      ? [
          {
            href: "/my-trips",
            label: "My trips",
            sub: "Saved trips on your account",
            icon: Map,
          },
        ]
      : []),
  ];

  return (
    <div className="sm:hidden print:hidden">
      {open && (
        <div
          className="fixed inset-0 z-[1099] bg-black/30"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-[1100] border-t border-line bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        {open && (
          <ul
            id="trip-menu"
            className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-2xl border border-line bg-card shadow-lg"
          >
            {menu.map(({ href, label, sub, icon: Icon }) => (
              <li key={href} className="border-b border-line last:border-0">
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname.startsWith(href) ? "page" : undefined}
                  className="flex items-center gap-3 p-3.5 aria-[current=page]:bg-accent-soft"
                >
                  <Icon className="size-5 shrink-0 text-accent" aria-hidden />
                  <span className="text-sm">
                    <span className="block font-medium">{label}</span>
                    <span className="text-xs text-muted">{sub}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <ul className="grid grid-cols-4">
          {tabs.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={tabClass(active)}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="trip-menu"
              className={tabClass(open || tripMatch(pathname))}
            >
              <ShoppingBag className="size-5" aria-hidden />
              Trip
              {hydrated && count > 0 && (
                <span className="absolute top-1 left-1/2 ml-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-background">
                  {count}
                </span>
              )}
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
