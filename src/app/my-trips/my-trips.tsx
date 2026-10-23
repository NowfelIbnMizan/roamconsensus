"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderOpen, LogOut, Save, ShoppingBag, Trash2 } from "lucide-react";
import { Avatar } from "@/components/account-button";
import { cartData } from "@/components/cart-sync";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import type { CartData } from "@/lib/cart-data";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { AlertsToggle, GroupTrips, SavedPlaces } from "./extras";

type TripRow = { id: string; name: string; updatedAt: string; stops: number; cities: string[] };

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

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
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

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
    setMessage(res.ok ? "Saved. Your trip cart is unchanged." : (body.error ?? "Couldn't save. Try again."));
    if (res.ok) {
      setName("");
      load();
    }
  }

  async function open(trip: TripRow) {
    if (items.length && !confirm(`Open "${trip.name}"? It replaces the ${items.length} items in your trip cart.`))
      return;
    const res = await fetch(`/api/account/trips/${trip.id}`);
    if (!res.ok) return setMessage("Couldn't open that trip. Try again.");
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
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-4">
        <Avatar name={user.name} image={user.image} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => authClient.signOut()}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </button>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Trip cart</h2>
        <p className="mt-1 text-muted">
          {hydrated ? `${items.length} ${items.length === 1 ? "item" : "items"}, ` : ""}kept in step with your account
          on every device you sign in on.
        </p>
        <Link
          href="/cart"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm"
        >
          <ShoppingBag className="size-4" aria-hidden />
          Open trip cart
        </Link>
        {hydrated && items.length > 0 && (
          <form onSubmit={save} className="mt-5 max-w-lg rounded-2xl border border-line bg-card p-4">
            <label htmlFor="trip-name" className="text-sm font-medium">
              Save a copy as a trip
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
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
                className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                <Save className="size-4" aria-hidden />
                Save trip
              </button>
            </div>
            {message && (
              <p role="status" className="mt-2 text-sm text-muted">
                {message}
              </p>
            )}
          </form>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Saved trips</h2>
        {trips === null ? (
          <p className="mt-2 text-muted">Loading…</p>
        ) : trips.length === 0 ? (
          <p className="mt-2 text-muted">No saved trips yet. Fill your trip cart, then save a copy above.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
            {trips.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted">
                    {[t.cities.join(", "), `${t.stops} ${t.stops === 1 ? "item" : "items"}`, dateLabel(t.updatedAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(t)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm"
                >
                  <FolderOpen className="size-4" aria-hidden />
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  aria-label={`Delete ${t.name}`}
                  className="flex size-8 items-center justify-center rounded-full border border-line text-muted hover:text-accent-2"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SavedPlaces />
      <GroupTrips />
      <AlertsToggle canEmail={canEmail} />

      <section className="border-t border-dashed border-line-strong pt-6">
        <button type="button" onClick={deleteAccount} className="text-sm text-muted underline hover:text-accent-2">
          Delete my account
        </button>
        {accountMessage && (
          <p role="status" className="mt-2 text-sm text-muted">
            {accountMessage}
          </p>
        )}
      </section>
    </div>
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
