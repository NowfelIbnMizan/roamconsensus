"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Heart, Users } from "lucide-react";
import { FavouriteButton } from "@/components/favourite-button";
import { useCart } from "@/lib/cart-store";
import { categoryLabel } from "@/lib/format";
import { useFavourites } from "@/lib/favourites";
import { placeHref } from "@/lib/place";
import type { ItemCategory } from "@/generated/prisma/enums";

type Favourite = {
  destination: string;
  destinationName: string;
  place: string;
  name: string;
  category: ItemCategory;
  area: string | null;
};

/** Fetches JSON once on mount and again whenever `version` changes. */
function useJson<T>(url: string, version: unknown = 0) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let stale = false;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((json) => !stale && setData(json));
    return () => {
      stale = true;
    };
  }, [url, version]);
  return data;
}

export function SavedPlaces() {
  // Reloads when a ♥ is toggled here or anywhere else on the site.
  const keys = useFavourites((s) => s.keys);
  const rows = useJson<Favourite[]>("/api/account/favourites", keys.size);
  const byCity = new Map<string, Favourite[]>();
  for (const f of rows ?? []) byCity.set(f.destinationName, [...(byCity.get(f.destinationName) ?? []), f]);

  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Heart className="size-5 text-accent-2" aria-hidden /> Saved places
      </h2>
      {rows === null ? (
        <p className="mt-2 text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-muted">Tap ♥ on any place to keep it here for later.</p>
      ) : (
        [...byCity].map(([city, places]) => (
          <div key={city} className="mt-3">
            <h3 className="font-hand text-xl text-accent-2">{city}</h3>
            <ul className="mt-1 divide-y divide-line rounded-2xl border border-line bg-card">
              {places.map((f) => (
                <li key={f.place} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={placeHref(f.destination, f.place)}
                      className="font-medium hover:text-accent hover:underline"
                    >
                      {f.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {[f.area, categoryLabel[f.category]].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <FavouriteButton destination={f.destination} place={f.place} name={f.name} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

type GroupRow = { id: string; name: string; members: number; stops: number; isOwner: boolean };

export function GroupTrips() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const groups = useJson<GroupRow[]>("/api/groups");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() || "Our trip", items }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) router.push(`/groups/${body.id}`);
    else setError(body.error ?? "Couldn't start it. Try again.");
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Users className="size-5 text-accent" aria-hidden /> Plan with friends
      </h2>
      <p className="mt-1 text-muted">
        Start a group trip, send friends the link, and everyone adds stops and votes 👍 on them.
      </p>
      {groups && groups.length > 0 && (
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-line/40">
                <span className="min-w-0 flex-1 font-medium">{g.name}</span>
                <span className="text-sm text-muted">
                  {g.members} {g.members === 1 ? "person" : "people"} · {g.stops} {g.stops === 1 ? "stop" : "stops"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={start} className="mt-4 max-w-lg rounded-2xl border border-line bg-card p-4">
        <label htmlFor="group-name" className="text-sm font-medium">
          Start a group trip
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Our Bali trip"
            className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 placeholder:text-muted"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
          >
            <Users className="size-4" aria-hidden /> Start
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          {items.length
            ? `Starts with the ${items.length} ${items.length === 1 ? "stop" : "stops"} in your trip cart.`
            : "Starts empty. Friends can add stops from their own carts."}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-accent-2">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

export function AlertsToggle({ canEmail }: { canEmail: boolean }) {
  const [version, setVersion] = useState(0);
  const state = useJson<{ enabled: boolean }>("/api/account/alerts", version);
  const [turnedOff] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("alerts") === "off",
  );
  const enabled = state?.enabled ?? false;

  async function toggle() {
    await fetch("/api/account/alerts", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setVersion((v) => v + 1);
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <Bell className="size-5 text-accent" aria-hidden /> Trip alerts
      </h2>
      <label className="mt-2 flex max-w-lg cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card p-4">
        <input
          type="checkbox"
          checked={enabled}
          disabled={state === null}
          onChange={toggle}
          className="mt-1 size-4 accent-[var(--accent)]"
        />
        <span>
          <span className="font-medium">Email me about my trip</span>
          <span className="block text-sm text-muted">
            Once a day at most: when prices change for stops in your trip cart, or creators add new routes for your
            cities.
          </span>
          {!canEmail && enabled && (
            <span className="mt-1 block text-xs text-muted">Emails start soon; you&apos;re on the list.</span>
          )}
        </span>
      </label>
      {turnedOff && !enabled && (
        <p role="status" className="mt-2 text-sm text-muted">
          Alerts are off. You won&apos;t get any more trip emails.
        </p>
      )}
    </section>
  );
}
