import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AddItemButton, AddRouteButton } from "@/components/add-to-cart";
import type { CartItem } from "@/lib/cart-store";
import { getItinerary, getItinerarySlugs } from "@/lib/data";
import { categoryLabel, formatMoney, tierLabel } from "@/lib/format";

export async function generateStaticParams() {
  return getItinerarySlugs();
}

export async function generateMetadata({ params }: PageProps<"/itineraries/[slug]">): Promise<Metadata> {
  const it = await getItinerary((await params).slug);
  return it ? { title: it.title, description: it.summary } : {};
}

export default async function ItineraryPage({ params }: PageProps<"/itineraries/[slug]">) {
  const it = await getItinerary((await params).slug);
  if (!it) notFound();

  const ref = { slug: it.slug, title: it.title };
  const cartItems = new Map<string, CartItem>(
    it.schedule.flatMap(({ items }) =>
      items.map((i) => [
        i.id,
        {
          id: i.id,
          name: i.name,
          category: i.category,
          priceCents: i.priceCents,
          currency: i.currency,
          unit: i.unit,
          quantity: i.quantity,
          vendor: i.vendor,
          bookUrl: i.bookUrl,
          couponCode: i.couponCode,
          itinerary: ref,
        },
      ]),
    ),
  );

  return (
    <>
      <Link href={`/destinations/${it.destination.slug}`} className="text-sm text-muted hover:text-foreground">
        ← {it.destination.name}
      </Link>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent">{tierLabel[it.tier]}</p>
      <h1 className="text-3xl font-semibold tracking-tight">{it.title}</h1>
      <p className="mt-2 text-muted">
        by{" "}
        <Link href={`/creators/${it.creator.handle}`} className="underline">
          {it.creator.name}
        </Link>{" "}
        · {it.days} days · {formatMoney(it.totalCents)} est. ·{" "}
        <a href={it.sourceUrl} className="underline" rel="noopener noreferrer" target="_blank">
          original
        </a>
      </p>
      <p className="mt-3 max-w-2xl">{it.summary}</p>
      <div className="mt-5">
        <AddRouteButton items={[...cartItems.values()]} />
      </div>

      <div className="mt-10 space-y-8">
        {it.schedule.map(({ day, items }) => (
          <section key={day}>
            <h2 className="text-lg font-semibold">Day {day}</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      {categoryLabel[item.category]}
                      {item.unit && ` · ${item.quantity} ${item.unit}${item.quantity > 1 ? "s" : ""}`}
                    </p>
                    {(item.couponCode || item.creditedTo) && (
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {item.couponCode && (
                          <span className="rounded border border-dashed border-accent px-1.5 py-0.5 font-mono text-accent">
                            {item.couponCode}
                          </span>
                        )}
                        {item.creditedTo && <span className="text-muted">via {item.creditedTo}&apos;s link</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm tabular-nums">
                      {item.priceCents === 0 ? "Free" : formatMoney(item.priceCents * item.quantity, item.currency)}
                    </span>
                    {item.bookUrl && (
                      <a
                        href={item.bookUrl}
                        rel="sponsored noopener noreferrer"
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-background"
                      >
                        {item.vendor} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                    <AddItemButton item={cartItems.get(item.id)!} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
