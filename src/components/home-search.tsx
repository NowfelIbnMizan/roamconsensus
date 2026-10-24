"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Plus, Search, X } from "lucide-react";
import { DateRange, rangeLabel, tripLength } from "@/components/date-range";
import { useCart } from "@/lib/cart-store";
import type { SearchEntry } from "@/lib/data";

const fold = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const order: Entry["kind"][] = [
  "Guide",
  "Destination",
  "Spot",
  "Itinerary",
  "Creator",
];
const MAX_CITIES = 4;
// Few suggestions, so the list never covers the page.
const MAX_RESULTS = 5;

/** A suggestion: anything in the search index, or a city tab picked out by a topic word ("esim bali"). */
type Entry = Omit<SearchEntry, "kind"> & {
  kind: SearchEntry["kind"] | "Guide";
};
const kindLabel: Record<Entry["kind"], string> = {
  Guide: "Guide",
  Destination: "City",
  Spot: "Spot",
  Itinerary: "Route",
  Creator: "Creator",
};

// Topic words that lead to a city tab. The first topic found wins, so "best time" means when-to-go, not top picks.
const TOPICS = [
  {
    tab: "esim",
    label: "eSIM plans",
    words: ["esim", "sim", "mobile data", "internet"],
  },
  {
    tab: "when",
    label: "Best time to go",
    words: ["best time", "when", "weather", "season", "rain", "month"],
  },
  {
    tab: "budget",
    label: "Budget",
    words: [
      "budget",
      "cost",
      "price",
      "money",
      "how much",
      "expensive",
      "cheap",
    ],
  },
  {
    tab: "stay",
    label: "Where to stay",
    words: ["stay", "hotel", "area", "neighbourhood", "neighborhood"],
  },
  {
    tab: "before",
    label: "Before you go",
    words: ["visa", "tips", "before", "safety", "scam", "checklist"],
  },
  {
    tab: "best",
    label: "Top picks",
    words: ["top", "best", "things to do", "must see", "must-see"],
  },
] as const;

// Rotating examples in the empty box, so people see it takes more than city names.
const EXAMPLES = [
  "Bali",
  "eSIM for Japan",
  "Best time for Bangkok",
  "Where to stay in Tokyo",
  "Visa for Vietnam",
];

type City = { slug: string; name: string; country: string };

/**
 * The home page's first thing: where are you going (one city or several), and when. Picking from the list only
 * fills the box; "Find trips" opens matching creator routes, split across the cities when there are several.
 * A spot, route or creator picked instead opens its own page.
 */
export function HomeSearch({ cities }: { cities: City[] }) {
  const router = useRouter();
  const listId = useId();
  const setStartDate = useCart((s) => s.setStartDate);
  const setTripDays = useCart((s) => s.setTripDays);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<City[]>([]);
  const [other, setOther] = useState<Entry | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [open, setOpen] = useState<"where" | "when" | null>(null);
  const [active, setActive] = useState(0);
  const [hint, setHint] = useState("");
  const loading = useRef(false);
  const box = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = () => {
    if (index || loading.current) return;
    loading.current = true;
    fetch("/api/search")
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => (loading.current = false));
  };

  // The "Plan" tab and old /search links land on /#plan, with any ?q= the visitor had typed.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    const go = () => {
      input.current?.focus({ preventScroll: true });
      box.current?.scrollIntoView({ block: "center" });
    };
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable after mount on a static page
      setQ(q);
      load();
    }
    if (q || window.location.hash === "#plan") go();
    // Tapping "Plan" while already here doesn't remount, so catch the click itself.
    const tap = (e: MouseEvent) =>
      (e.target as Element).closest?.('a[href="/#plan"]') && setTimeout(go);
    document.addEventListener("click", tap);
    return () => document.removeEventListener("click", tap);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  useEffect(() => {
    const away = (e: PointerEvent) =>
      !box.current?.contains(e.target as Node) && setOpen(null);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const words = fold(q).split(/\s+/).filter(Boolean);
  const chosen = new Set(picked.map((c) => c.slug));
  const cityEntry = (c: City): SearchEntry => ({
    kind: "Destination",
    href: `/destinations/${c.slug}`,
    title: c.name,
    sub: c.country,
    text: "",
  });
  const text = fold(q);
  // Word starts only, so "stop" isn't "top" and "Bahrain" isn't "rain".
  const has = (w: string) => new RegExp(`(^|\\s)${w}`).test(text);
  const topic = TOPICS.find((t) => t.words.some(has));
  // What's left once the topic words are gone names the place, if any.
  const rest = topic
    ? topic.words
        .reduce((t, w) => t.replace(new RegExp(`(^|\\s)${w}\\S*`), " "), text)
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 1 &&
            ![
              "for",
              "in",
              "to",
              "the",
              "of",
              "visit",
              "where",
              "what",
              "is",
              "a",
            ].includes(w),
        )
    : words;
  // Only the leftover words that name a place count, so filler like "good" doesn't hide every city.
  const inPlace = (c: City, w: string) =>
    fold(`${c.name} ${c.country}`)
      .split(/\s+/)
      .some((p) => p.startsWith(w));
  const placeWords = rest.filter((w) => cities.some((c) => inPlace(c, w)));
  const placeMatch = (c: City) => placeWords.every((w) => inPlace(c, w));
  // Cities match from the list we already have, so they show before the index arrives.
  const cityHits = cities
    .filter(
      (c) =>
        !chosen.has(c.slug) &&
        words.every((w) => fold(`${c.name} ${c.country}`).includes(w)),
    )
    .map(cityEntry);
  const topicHits: Entry[] =
    topic && !picked.length
      ? [
          ...(topic.tab === "before" && has("visa")
            ? [
                {
                  kind: "Guide" as const,
                  href: "/visa",
                  title: "Visa checker",
                  sub: "Every city, your passport",
                  text: "",
                },
              ]
            : []),
          ...(placeWords.length ? cities.filter(placeMatch) : cities).map(
            (c) => ({
              kind: "Guide" as const,
              href: `/destinations/${c.slug}/${topic.tab}`,
              title: `${c.name}: ${topic.label}`,
              sub: c.country,
              text: "",
            }),
          ),
        ]
      : [];
  // Once a city is in, only more cities make sense; a spot or creator is a different kind of search.
  const results: Entry[] = (
    !words.length
      ? []
      : picked.length
        ? cityHits
        : [
            ...topicHits,
            ...(topic ? [] : cityHits),
            ...(topic
              ? []
              : (index ?? [])
                  .filter((e) => e.kind !== "Destination")
                  .map((e) => ({ e, text: fold(e.text), title: fold(e.title) }))
                  // Every word should match; with long queries, most will do.
                  .filter(
                    ({ text }) =>
                      words.filter((w) => text.includes(w)).length >=
                      Math.min(
                        words.length,
                        Math.max(2, Math.ceil(words.length * 0.6)),
                      ),
                  )
                  .sort(
                    (x, y) =>
                      words.filter((w) => y.title.includes(w)).length -
                        words.filter((w) => x.title.includes(w)).length ||
                      order.indexOf(x.e.kind) - order.indexOf(y.e.kind),
                  )
                  .map(({ e }) => e)),
          ]
  ).slice(0, MAX_RESULTS);

  const choose = (r: Entry) => {
    setHint("");
    setQ("");
    setActive(0);
    if (r.kind === "Destination") {
      const city = cities.find((c) => r.href.endsWith(`/${c.slug}`));
      if (city && picked.length < MAX_CITIES) setPicked([...picked, city]);
      setOther(null);
      input.current?.focus();
    } else {
      setOther(r);
      setPicked([]);
      setOpen(null);
    }
  };

  const find = () => {
    if (other) return router.push(other.href);
    let trip = picked;
    if (!trip.length) {
      // Typed but didn't pick: take the best match, so Enter or "Find trips" always goes somewhere.
      const top = words.length ? results[0] : undefined;
      if (top && top.kind !== "Destination") return router.push(top.href);
      const city = top && cities.find((c) => top.href.endsWith(`/${c.slug}`));
      if (!city) {
        setHint(
          words.length
            ? "No match. Try a city, like Bali"
            : "Pick a city first",
        );
        setOpen("where");
        return input.current?.focus();
      }
      trip = [city];
    }
    const params = new URLSearchParams({
      where: trip.map((c) => c.slug).join(","),
    });
    if (start && end) {
      params.set("days", String(tripLength(start, end)));
      params.set("start", start);
      // The trip cart and trip mode use the same dates, so the plan starts on the right day.
      setStartDate(start);
      setTripDays(tripLength(start, end));
    }
    router.push(`/itineraries?${params}`);
  };

  // The list is only there while typing; it never opens on an empty box.
  const showList = open === "where" && words.length > 0 && results.length > 0;
  const [example, setExample] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setExample((n) => (n + 1) % EXAMPLES.length),
      2500,
    );
    return () => clearInterval(t);
  }, []);
  const whenLabel = start
    ? `${rangeLabel(start, end)}${end ? ` · ${tripLength(start, end)} days` : ""}`
    : "Add dates";
  return (
    <form
      ref={box}
      id="plan"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        // Enter in the box picks the highlighted match; the "Find trips" button always searches.
        const fromButton = (e.nativeEvent as SubmitEvent).submitter !== null;
        if (!fromButton && showList && words.length && results[active])
          choose(results[active]);
        else find();
      }}
      className="relative mt-5 max-w-2xl scroll-mt-4"
    >
      <div className="grid grid-cols-[1fr_auto] gap-1 rounded-3xl border border-line-strong bg-card p-2 shadow-lg shadow-black/5 sm:flex sm:items-center sm:rounded-full">
        <label className="col-span-2 flex min-w-0 flex-1 items-center gap-3 rounded-full px-4 py-2 focus-within:bg-background focus-within:ring-2 focus-within:ring-accent">
          <Search className="size-5 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold">
              Search trips, cities and tips
            </span>
            <span className="flex flex-wrap items-center gap-1">
              {[
                ...picked.map((c) => ({ key: c.slug, label: c.name })),
                ...(other ? [{ key: "", label: other.title }] : []),
              ].map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-0.5 rounded-full bg-accent-soft py-0.5 pr-1 pl-2.5 text-sm font-medium text-accent"
                >
                  {c.label}
                  <button
                    type="button"
                    aria-label={`Remove ${c.label}`}
                    onClick={() =>
                      c.key
                        ? setPicked(picked.filter((p) => p.slug !== c.key))
                        : setOther(null)
                    }
                    className="flex size-5 items-center justify-center rounded-full hover:bg-accent/15"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
              {!other && picked.length < MAX_CITIES && (
                <input
                  ref={input}
                  type="search"
                  value={q}
                  role="combobox"
                  aria-expanded={showList}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    showList ? `${listId}-${active}` : undefined
                  }
                  onFocus={(e) => {
                    load();
                    setOpen("where");
                    // On a phone the keyboard covers half the screen, so bring the box and its results to the top.
                    if (window.matchMedia("(max-width: 639px)").matches)
                      e.currentTarget.closest("form")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setActive(0);
                    setOpen("where");
                    load();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => Math.min(a + 1, results.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => Math.max(a - 1, 0));
                    } else if (e.key === "Escape") setOpen(null);
                    else if (e.key === "Backspace" && !q && picked.length)
                      setPicked(picked.slice(0, -1));
                  }}
                  onBlur={() => setOpen((o) => (o === "where" ? null : o))}
                  placeholder={
                    picked.length
                      ? "Add another city"
                      : `Try “${EXAMPLES[example]}”`
                  }
                  style={{ outline: "none" }}
                  className="min-w-28 flex-1 bg-transparent py-0.5 text-base placeholder:text-muted"
                />
              )}
            </span>
          </span>
        </label>
        <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
        <button
          type="button"
          aria-expanded={open === "when"}
          onClick={() => setOpen(open === "when" ? null : "when")}
          className="flex items-center gap-3 rounded-full px-4 py-2 text-left hover:bg-background"
        >
          <CalendarDays className="size-5 shrink-0 text-accent" aria-hidden />
          <span>
            <span className="block text-xs font-semibold">When?</span>
            <span
              className={`block text-base whitespace-nowrap ${start ? "" : "text-muted"}`}
            >
              {whenLabel}
            </span>
          </span>
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 font-medium whitespace-nowrap text-background"
        >
          <Search className="size-4" aria-hidden /> Search
        </button>
      </div>
      {hint && (
        <p className="mt-2 px-4 text-sm text-accent-2" role="alert">
          {hint}
        </p>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-auto rounded-2xl border border-line bg-card p-1 shadow-xl"
        >
          {picked.length > 0 && (
            <li className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-xs text-muted">
              <Plus className="size-3.5" aria-hidden /> Add another city to
              combine them in one trip
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={r.href}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-line/50" : ""}`}
            >
              <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-accent">
                {kindLabel[r.kind]}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.title}</span>
                <span className="block truncate text-sm text-muted">
                  {r.sub}
                </span>
              </span>
            </li>
          ))}
          {words.length > 0 && !index && !picked.length && (
            <li className="px-3 py-2 text-sm text-muted">Searching…</li>
          )}
        </ul>
      )}

      {open === "when" && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-line bg-card p-4 shadow-xl sm:p-5">
          <DateRange
            start={start}
            end={end}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
              if (s && e) setOpen(null);
            }}
          />
          {start && (
            <div className="mt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setStart(null);
                  setEnd(null);
                }}
                className="text-sm text-muted underline hover:text-foreground"
              >
                Clear dates
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
