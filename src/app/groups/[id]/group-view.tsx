"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, LogOut, RefreshCw, Share2, Luggage, ThumbsUp, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/account-button";
import { Thumb } from "@/components/thumb";
import { AddItemButton } from "@/components/add-to-cart";
import { authClient, signInWithGoogle } from "@/lib/auth-client";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { categoryLabel } from "@/lib/format";
import type { GroupView } from "@/lib/groups";

const button = "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent";

export function GroupTripView() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <p className="text-muted">Loading…</p>;
  if (!session)
    return (
      <section className="max-w-md rounded-2xl border border-line bg-card p-6">
        <h1 className="font-display text-2xl font-semibold">Sign in to see this group trip</h1>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="mt-4 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          Continue with Google
        </button>
      </section>
    );
  return <Group />;
}

function Group() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useCartHydrated();
  const cart = useCart((s) => s.items);
  const addToCart = useCart((s) => s.add);
  const [group, setGroup] = useState<GroupView | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}`).catch(() => null);
    if (res?.status === 404 || res?.status === 401) return setMissing(true);
    if (res?.ok) setGroup(await res.json());
  }, [id]);

  // Friends edit the same trip, so it reloads every 20 seconds while the tab is open.
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && void load();
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  if (missing)
    return (
      <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
        This group trip doesn&apos;t exist, or you&apos;re not in it. Ask for the invite link.
      </p>
    );
  if (!group) return <p className="text-muted">Loading…</p>;

  const inviteUrl = `${window.location.origin}/groups/join/${group.inviteToken}`;
  const ids = new Set(group.items.map((i) => i.id));
  const fromCart = hydrated ? cart.filter((i) => !ids.has(i.id)) : [];
  const byCity = new Map<string, GroupView["items"]>();
  for (const i of group.items) {
    const city = i.item.destination?.name ?? "Other";
    byCity.set(city, [...(byCity.get(city) ?? []), i]);
  }

  const post = (path: string, body: unknown) =>
    fetch(`/api/groups/${id}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  async function addMine() {
    const res = await post("/items", { items: fromCart });
    const body = await res.json().catch(() => ({}));
    setMessage(res.ok ? `Added ${body.added} ${body.added === 1 ? "stop" : "stops"} from your trip.` : body.error);
    void load();
  }

  async function vote(itemId: string) {
    setGroup(
      (g) =>
        g && {
          ...g,
          items: g.items.map((i) =>
            i.id === itemId ? { ...i, voted: !i.voted, votes: i.votes + (i.voted ? -1 : 1) } : i,
          ),
        },
    );
    await post("/vote", { itemId });
    void load();
  }

  async function removeItem(itemId: string, name: string) {
    if (!confirm(`Remove ${name} from the group trip for everyone?`)) return;
    await fetch(`/api/groups/${id}/items?${new URLSearchParams({ itemId })}`, {
      method: "DELETE",
    });
    void load();
  }

  async function copyInvite() {
    try {
      if (navigator.share)
        await navigator.share({
          title: group!.name,
          text: "Plan this trip with me",
          url: inviteUrl,
        });
      else {
        await navigator.clipboard.writeText(inviteUrl);
        setMessage("Invite link copied.");
      }
    } catch {} // share sheet closed
  }

  async function newLink() {
    if (!confirm("Make a new invite link? The old link stops working. People already in stay in.")) return;
    await post("/invite", {});
    void load();
  }

  async function leave() {
    const question = group!.isOwner
      ? `Delete "${group!.name}" for everyone? This can't be undone.`
      : `Leave "${group!.name}"? You'll need a new invite to come back.`;
    if (!confirm(question)) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    router.push("/my-trips");
  }

  function copyAll() {
    addToCart(group!.items.map((i) => i.item));
    router.push("/cart");
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Group trip</p>
        <h1 className="text-3xl font-semibold tracking-tight">{group.name}</h1>
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="People in this trip">
          {group.members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-1.5 rounded-full border border-line bg-card py-0.5 pr-3 pl-0.5 text-sm"
            >
              <Avatar name={m.name} image={m.image} className="size-6" />
              {m.name.split(" ")[0]}
              {m.isOwner && <span className="text-xs text-muted">(organiser)</span>}
            </li>
          ))}
        </ul>
      </header>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="flex items-center gap-2 font-medium">
          <Link2 className="size-4 text-accent" aria-hidden /> Invite friends
        </h2>
        <p className="mt-1 text-sm text-muted">Anyone with this link can join after signing in with Google.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            readOnly
            value={inviteUrl}
            aria-label="Invite link"
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 basis-56 rounded-lg border border-line bg-background px-3 py-2 text-sm text-muted"
          />
          <button type="button" onClick={copyInvite} className={button}>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <Share2 className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            Share link
          </button>
          {group.isOwner && (
            <button type="button" onClick={newLink} className={button}>
              <RefreshCw className="size-4" aria-hidden /> New link
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {fromCart.length > 0 && (
          <button type="button" onClick={addMine} className={button}>
            <Upload className="size-4" aria-hidden /> Add {fromCart.length} {fromCart.length === 1 ? "stop" : "stops"}{" "}
            from my cart
          </button>
        )}
        {group.items.length > 0 && (
          <button type="button" onClick={copyAll} className={button}>
            <Luggage className="size-4" aria-hidden /> Copy all to my trip
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}

      {group.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          No stops yet. Add places to your trip, then come back and add them here. Or{" "}
          <Link href="/#destinations" className="underline">
            browse destinations
          </Link>
          .
        </p>
      ) : (
        [...byCity].map(([city, items]) => (
          <section key={city}>
            <h2 className="mb-2 text-xl font-semibold">{city}</h2>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => vote(i.id)}
                    aria-pressed={i.voted}
                    aria-label={`${i.voted ? "Remove your vote for" : "Vote for"} ${i.item.name}`}
                    className={`inline-flex min-w-14 items-center justify-center gap-1 rounded-full border px-2 py-1 text-sm tabular-nums ${
                      i.voted ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"
                    }`}
                  >
                    <ThumbsUp className={`size-4 ${i.voted ? "fill-current" : ""}`} aria-hidden /> {i.votes}
                  </button>
                  <Thumb url={i.item.photoUrl} category={i.item.category} className="size-12 rounded-lg" />
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="font-medium">{i.item.name}</p>
                    <p className="text-xs text-muted">
                      {categoryLabel[i.item.category]} · from{" "}
                      <Link href={`/itineraries/${i.item.itinerary.slug}`} className="underline">
                        {i.item.itinerary.title}
                      </Link>{" "}
                      · added by {i.addedBy.split(" ")[0]}
                    </p>
                  </div>
                  <AddItemButton item={i.item} />
                  {i.canRemove && (
                    <button
                      type="button"
                      onClick={() => removeItem(i.id, i.item.name)}
                      aria-label={`Remove ${i.item.name} from the group trip`}
                      className="text-muted hover:text-rose-600"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <section className="border-t border-dashed border-line-strong pt-6">
        <button
          type="button"
          onClick={leave}
          className="inline-flex items-center gap-1.5 text-sm text-muted underline hover:text-accent-2"
        >
          {group.isOwner ? <Trash2 className="size-4" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
          {group.isOwner ? "Delete this group trip" : "Leave this group trip"}
        </button>
      </section>
    </div>
  );
}
