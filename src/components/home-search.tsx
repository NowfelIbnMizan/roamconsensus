"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import type { SearchEntry } from "@/lib/data";
import { LENGTHS } from "@/lib/trip-lengths";

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const order: SearchEntry["kind"][] = ["Destination", "Spot", "Itinerary", "Creator"];

type City = { slug: string; name: string; country: string };

/**
 * The home page's first thing: where are you going, and for how long. A city plus a length goes straight to matching
 * creator routes; typing anything else (a spot, a creator, a route) searches the whole site as you type.
 */
export function HomeSearch({ cities }: { cities: City[] }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [length, setLength] = useState(0);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const loading = useRef(false);
  const box = useRef<HTMLFormElement>(null);

  const load = () => {
    if (index || loading.current) return;
    loading.current = true;
    fetch("/api/search")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => (loading.current = false));
  };

  useEffect(() => {
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const words = fold(q).split(/\s+/).filter(Boolean);
  // Cities match from the list we already have, so they show before the index arrives.
  const cityHits = cities
    .filter((c) => words.every((w) => fold(`${c.name} ${c.country}`).includes(w)))
    .map((c) => ({ kind: "Destination" as const, href: `/destinations/${c.slug}`, title: c.name, sub: c.country, text: "" }));
  const results: SearchEntry[] = !words.length
    ? cities.map((c) => ({ kind: "Destination", href: `/destinations/${c.slug}`, title: c.name, sub: c.country, text: "" }))
    : [
        ...cityHits,
        ...(index ?? [])
          .filter((e) => e.kind !== "Destination")
          .map((e) => ({ e, text: fold(e.text), title: fold(e.title) }))
          .filter(({ text }) => words.every((w) => text.includes(w)))
          .sort(
            (x, y) =>
              words.filter((w) => y.title.includes(w)).length - words.filter((w) => x.title.includes(w)).length ||
              order.indexOf(x.e.kind) - order.indexOf(y.e.kind),
          )
          .map(({ e }) => e),
      ].slice(0, 8);

  /** A city with a trip length opens the matching routes; anything else opens its own page. */
  const go = (r: SearchEntry | undefined) => {
    if (!r) {
      if (words.length) router.push(`/search?q=${encodeURIComponent(q)}`);
      else router.push(length ? `/itineraries?length=${length}` : "/itineraries");
      return;
    }
    const city = r.kind === "Destination" ? r.href.split("/").pop() : null;
    router.push(city && length ? `/itineraries?where=${city}&length=${length}` : r.href);
  };

  const showList = open && results.length > 0;
  return (
    <form
      ref={box}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(words.length ? results[active] : undefined);
      }}
      className="relative mt-5 max-w-2xl scroll-mt-4"
    >
      <div className="grid grid-cols-[1fr_auto] gap-1 rounded-3xl border border-line-strong bg-card p-2 shadow-lg shadow-black/5 sm:flex sm:items-center sm:rounded-full">
        <label className="col-span-2 flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2 focus-within:bg-background focus-within:ring-2 focus-within:ring-accent">
          <MapPin className="size-5 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">Where to?</span>
            <input
              type="search"
              value={q}
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={showList ? `${listId}-${active}` : undefined}
              onFocus={(e) => {
                load();
                setOpen(true);
                // On a phone the keyboard covers half the screen, so bring the box and its results to the top.
                if (window.matchMedia("(max-width: 639px)").matches)
                  e.currentTarget.closest("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
                setOpen(true);
                load();
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Bali, Tokyo, a spot…"
              style={{ outline: "none" }}
              className="w-full bg-transparent text-base placeholder:text-muted"
            />
          </span>
        </label>
        <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
        <label className="flex items-center gap-3 rounded-full px-4 py-2 focus-within:bg-background">
          <CalendarDays className="size-5 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="block text-xs font-semibold">How long?</span>
            <select
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="bg-transparent text-base outline-none"
            >
              {LENGTHS.map((l, i) => (
                <option key={l.label} value={i}>
                  {i ? l.label : "Any length"}
                </option>
              ))}
            </select>
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-medium whitespace-nowrap text-background"
        >
          <Search className="size-4" aria-hidden /> Find trips
        </button>
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-auto rounded-2xl border border-line bg-card p-1 shadow-xl"
        >
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-line/50" : ""}`}
            >
              <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-accent">{r.kind}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.title}</span>
                <span className="block truncate text-sm text-muted">{r.sub}</span>
              </span>
            </li>
          ))}
          {words.length > 0 && !index && <li className="px-3 py-2 text-sm text-muted">Searching…</li>}
        </ul>
      )}
    </form>
  );
}
