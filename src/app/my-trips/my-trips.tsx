"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, FolderOpen, LogOut, Plane, Save, ShoppingBag, Trash2 } from "lucide-react";
import { Avatar } from "@/components/account-button";
import { cartData } from "@/components/cart-sync";
import { Thumb } from "@/components/thumb";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import type { CartData } from "@/lib/cart-data";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import type { ItemCategory } from "@/generated/prisma/enums";
import { AlertsToggle, GroupTrips, SavedPlaces } from "./extras";

type TripRow = {
  id: string;
  name: string;
  updatedAt: string;
  stops: number;
  cities: string[];
  days: number;
  photoUrl: string | null;
  category: ItemCategory;
};

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** A default name for a saved trip: its cities and the month, e.g. "Bangkok + Chiang Mai, Oct 2026". */
function suggestName(items: CartData["items"]) {
  const cities = [...new Set(items.map((i) => i.destination?.name).filter(Boolean))].slice(0, 3).join(" + ");
  const month = new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" });
  return cities ? `${cities}, ${month}` : `My trip, ${month}`;
}

export function MyTrips({ canEmail }: { canEmail: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <p className="text-muted">Loading…</p>;
  if (!session) return <SignedOut />;
  return <SignedIn user={session.user} canEmail={canEmail} />;
}

function SignedOut() {
  return (
    <section className="max-w-lg rounded-2xl border border-line bg-card p-6">
      <h2 className="font-display text-2xl font-semibold">Sign in to keep your trips</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
        <li>Your trip cart shows up on your phone and laptop.</li>
        <li>Save trips by name and come back to them.</li>
        <li>Heart places, add notes, and plan a trip with friends.</li>
        <li>What you added before signing in stays in your cart.</li>
      </ul>
      <button
        type="button"
        onClick={() => signInWithGoogle("/my-trips")}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
      >
        <GoogleMark />
        Continue with Google
      </button>
      <p className="mt-3 text-xs text-muted">
        We only get your name, email and profile photo. See the{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </section>
  );
}

function SignedIn({
  user,
  canEmail,
}: {
  user: { name: string; email: string; image?: string | null };
  canEmail: boolean;
}) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCart((s) => s.items);
  const [trips, setTrips] = useState<TripRow[] | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  // An alerts email's "turn off" link lands here, so open the account panel that holds the switch.
  const [fromAlerts] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("alerts"),
  );

  // Bumped after a save or delete to fetch the list again.
  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);
  useEffect(() => {
    let stale = false;
    fetch("/api/account/trips")
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => [])
      .then((rows: TripRow[]) => !stale && setTrips(rows));
    return () => {
      stale = true;
    };
  }, [version]);

  async function open(trip: TripRow) {
    if (items.length && !confirm(`Open "${trip.name}"? It replaces the ${items.length} items in your trip cart.`))
      return;
    const res = await fetch(`/api/account/trips/${trip.id}`);
    if (!res.ok) return alert("Couldn't open that trip. Try again.");
    const { data } = (await res.json()) as { data: CartData };
    useCart.setState(data);
    router.push("/cart");
  }

  async function remove(trip: TripRow) {
    if (!confirm(`Delete "${trip.name}"? This can't be undone. Your trip cart is not affected.`)) return;
    await fetch(`/api/account/trips/${trip.id}`, { method: "DELETE" });
    load();
  }

  async function deleteAccount() {
    if (
      !confirm(
        "Delete your Creatour account and all saved trips? This can't be undone. Your trip cart stays on this device.",
      )
    )
      return;
    const { error } = await authClient.deleteUser();
    // Deleting needs a recent sign-in, so an old session is asked to sign in again first.
    if (error) setAccountMessage("For safety, sign out and sign in again, then delete your account.");
    else router.refresh();
  }

  return (
    <div className="space-y-10">
      {hydrated && <PlanningNow onSaved={load} />}

      <section>
        <h2 className="text-xl font-semibold">Saved trips{trips?.length ? ` · ${trips.length}` : ""}</h2>
        {trips === null ? (
          <p className="mt-2 text-muted">Loading…</p>
        ) : trips.length === 0 ? (
          <p className="mt-2 text-muted">None yet. Save a copy of your trip cart to keep it here.</p>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => (
              <li key={t.id} className="min-w-0">
                <TripCard trip={t} onOpen={() => open(t)} onDelete={() => remove(t)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-10 md:grid-cols-2 md:gap-8">
        <div className="min-w-0">
          <SavedPlaces />
        </div>
        <div className="min-w-0">
          <GroupTrips />
        </div>
      </div>

      <details open={fromAlerts} className="group rounded-2xl border border-line bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <Avatar name={user.name} image={user.image} className="size-10" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{user.name}</span>
            <span className="block truncate text-sm text-muted">{user.email}</span>
          </span>
          <span className="text-sm text-muted">Account</span>
          <ChevronDown className="size-4 shrink-0 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-4 border-t border-line p-4">
          <AlertsToggle canEmail={canEmail} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
            <button type="button" onClick={deleteAccount} className="text-sm text-muted underline hover:text-accent-2">
              Delete my account
            </button>
          </div>
          {accountMessage && (
            <p role="status" className="text-sm text-muted">
              {accountMessage}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** The trip cart being planned right now: what's in it, how far along it is, and what to do next. */
function PlanningNow({ onSaved }: { onSaved: () => void }) {
  const items = useCart((s) => s.items);
  const tripDays = useCart((s) => s.tripDays);
  const startDate = useCart((s) => s.startDate);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!items.length)
    return (
      <section className="rounded-2xl border border-dashed border-line-strong p-6 text-center">
        <p className="font-display text-xl font-semibold">Your trip cart is empty</p>
        <p className="mt-1 text-sm text-muted">Pick a route creators agree on and build from there.</p>
        <Link
          href="/itineraries"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          Find a trip
        </Link>
      </section>
    );

  const cities = [...new Set(items.map((i) => i.destination?.name).filter(Boolean))];
  const days = tripDays || Math.max(0, ...items.map((i) => i.day ?? 0));
  const placed = items.filter((i) => i.day).length;
  const faces = [...items.filter((i) => i.photoUrl), ...items.filter((i) => !i.photoUrl)].slice(0, 4);
  const button = "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/account/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() || suggestName(items), data: cartData() }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Saved below. Your trip cart is unchanged." : (body.error ?? "Couldn't save. Try again."));
    if (res.ok) {
      setName("");
      setSaving(false);
      onSaved();
    }
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-accent bg-accent-soft/40 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="eyebrow text-accent">Planning now</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{cities.join(" + ") || "My trip"}</h2>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {days > 0 && (
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {days} {days === 1 ? "day" : "days"}
              {startDate && ` from ${shortDate(startDate)}`}
            </li>
          )}
          <li className="inline-flex items-center gap-1.5">
            <ShoppingBag className="size-4" aria-hidden />
            {items.length} {items.length === 1 ? "stop" : "stops"}
          </li>
        </ul>
        <div
          role="progressbar"
          aria-label="Stops placed on a day"
          aria-valuenow={placed}
          aria-valuemax={items.length}
          className="mt-4 h-2 overflow-hidden rounded-full bg-line"
        >
          <div className="h-full bg-accent" style={{ width: `${(placed / items.length) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {placed === items.length ? "Every stop has a day" : `${placed} of ${items.length} stops placed on a day`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
          >
            Open trip cart
          </Link>
          <Link href="/today" className={button}>
            <Plane className="size-4" aria-hidden /> Trip mode
          </Link>
          <button type="button" aria-expanded={saving} onClick={() => setSaving(!saving)} className={button}>
            <Save className="size-4" aria-hidden /> Save a copy
          </button>
        </div>
        {saving && (
          <form onSubmit={save} className="mt-3 flex max-w-lg flex-wrap gap-2">
            <label htmlFor="trip-name" className="sr-only">
              Trip name
            </label>
            <input
              id="trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder={suggestName(items)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 placeholder:text-muted"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              Save trip
            </button>
          </form>
        )}
        {message && (
          <p role="status" className="mt-2 text-sm text-muted">
            {message}
          </p>
        )}
      </div>
      <ul className="grid grid-cols-4 gap-2 md:grid-cols-2">
        {faces.map((i) => (
          <li key={i.id} className="min-w-0">
            <Thumb
              url={i.photoUrl}
              category={i.category}
              className="aspect-square w-full rounded-xl md:size-24"
              sizes="96px"
            />
            <p className="mt-1 truncate text-xs text-muted md:w-24">{i.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TripCard({ trip, onOpen, onDelete }: { trip: TripRow; onOpen: () => void; onDelete: () => void }) {
  return (
    <article className="flex h-full overflow-hidden rounded-2xl border border-line bg-card sm:flex-col">
      <Thumb
        url={trip.photoUrl}
        category={trip.category}
        className="w-24 shrink-0 self-stretch sm:aspect-[2/1] sm:w-full"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 96px"
      />
      <div className="flex min-w-0 flex-1 flex-col p-4">
        {trip.cities.length > 0 && <p className="eyebrow truncate">{trip.cities.join(" + ")}</p>}
        <h3 className="mt-1 font-semibold">{trip.name}</h3>
        <p className="mt-1 text-sm text-muted">
          {[
            trip.days ? `${trip.days} ${trip.days === 1 ? "day" : "days"}` : null,
            `${trip.stops} ${trip.stops === 1 ? "stop" : "stops"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="fine-print mr-auto whitespace-nowrap">Saved {dateLabel(trip.updatedAt)}</span>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm hover:border-accent"
          >
            <FolderOpen className="size-4" aria-hidden />
            Open
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${trip.name}`}
            className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:text-accent-2"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 rounded-full bg-white p-0.5" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2.1-1.9 3.3-4.8 3.3-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z" />
    </svg>
  );
}
