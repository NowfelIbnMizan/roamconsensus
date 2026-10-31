"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, Heart, Plus, Users } from "lucide-react";
import { FavouriteButton } from "@/components/favourite-button";
import { Thumb } from "@/components/thumb";
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
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows?.slice(0, 3);

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Heart className="size-4 text-accent-2" aria-hidden /> Liked places{rows?.length ? ` · ${rows.length}` : ""}
      </h2>
      {rows === null ? (
        <p className="mt-2 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Tap ♥ on any place to keep it here.</p>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-line">
            {shown?.map((f) => (
              <li key={`${f.destination}/${f.place}`} className="flex items-center gap-3 py-2">
                <Thumb category={f.category} className="size-10 shrink-0 rounded-lg" alt="" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={placeHref(f.destination, f.place)}
                    className="block truncate text-sm font-medium hover:text-accent hover:underline"
                  >
                    {f.name}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {[f.destinationName, f.area ?? categoryLabel[f.category]].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <FavouriteButton destination={f.destination} place={f.place} name={f.name} />
              </li>
            ))}
          </ul>
          {rows.length > 3 && (
            <button
              type="button"
              aria-expanded={all}
              onClick={() => setAll(!all)}
              className="mt-1 text-sm font-medium text-accent hover:underline"
            >
              {all ? "Show fewer" : `Show all ${rows.length}`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

type GroupRow = {
  id: string;
  name: string;
  members: number;
  stops: number;
  isOwner: boolean;
};

export function GroupTrips() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const groups = useJson<GroupRow[]>("/api/groups");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() || "Our trip", items }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) router.push(`/groups/${body.id}`);
    else setError(body.error ?? "Couldn't start the group trip. Check your connection and try again.");
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Users className="size-4 text-accent" aria-hidden /> Plan with friends
      </h2>
      {groups && groups.length > 0 ? (
        <ul className="mt-2 divide-y divide-line">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={`/groups/${g.id}`} className="flex items-center gap-2 py-2.5 text-sm hover:text-accent">
                <span className="min-w-0 flex-1 truncate font-medium">{g.name}</span>
                <span className="shrink-0 text-muted">
                  {g.members} {g.members === 1 ? "person" : "people"}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-muted">Share a link. Everyone adds stops and votes.</p>
      )}
      {open ? (
        <form onSubmit={start} className="mt-3">
          <label htmlFor="group-name" className="text-sm font-medium">
            Group trip name
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="Our Bali trip"
              autoFocus
              className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 text-sm placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
            >
              Start
            </button>
          </div>
          <p className="fine-print mt-1.5">
            {items.length
              ? `Starts with the ${items.length} ${items.length === 1 ? "stop" : "stops"} in your current trip.`
              : "Starts empty. Friends add stops from their own trips."}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-accent-2">
              {error}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent"
        >
          <Plus className="size-4" aria-hidden /> Start a group trip
        </button>
      )}
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
    <div>
      <div className="flex items-center gap-3">
        <Bell className="size-4 shrink-0 text-accent" aria-hidden />
        <span id="alerts-label" className="flex-1 text-sm">
          Trip emails
          <span className="fine-print block">Price changes, new routes. Max once a day.</span>
        </span>
        <Switch on={enabled} disabled={state === null} onClick={toggle} labelledBy="alerts-label" />
      </div>
      {!canEmail && enabled && <p className="mt-2 text-xs text-muted">Emails start soon; you&apos;re on the list.</p>}
      {turnedOff && !enabled && (
        <p role="status" className="mt-2 text-sm text-muted">
          Alerts are off. You won&apos;t get any more trip emails.
        </p>
      )}
    </div>
  );
}

function Switch({
  on,
  disabled,
  onClick,
  labelledBy,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-accent" : "bg-line-strong"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform ${on ? "translate-x-4" : ""}`}
      />
    </button>
  );
}
