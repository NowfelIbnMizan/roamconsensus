import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { SampleBanner } from "@/components/sample-banner";
import { AddItemButton, AddRouteButton } from "@/components/add-to-cart";
import type { CartItem } from "@/lib/cart-store";
import { getItinerary, getItinerarySlugs } from "@/lib/data";
import { categoryLabel, formatMoney, formatPrice, sentimentLabel, tierLabel } from "@/lib/format";

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
  // Places the creator says to skip stay listed but out of the route bundle.
  const skipped = new Set(
    it.schedule.flatMap(({ items }) => items.filter((i) => i.sentiment === "AVOID").map((i) => i.id)),
  );
  const cartItems = new Map<string, CartItem>(
    it.schedule.flatMap(({ items }) =>
      items.map((i) => [
        i.id,
        {
          id: i.id,
          name: i.name,
          category: i.category,
          priceCents: i.priceCents,
          priceNote: i.priceNote,
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
      {it.destination.isSample && <SampleBanner />}
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
        · {it.days} days ·{" "}
        {it.totalCents > 0 && <>{formatMoney(it.totalCents)} est.{it.unpricedCount > 0 && " for priced items"} · </>}
        <a href={it.sourceUrl} className="underline" rel="noopener noreferrer" target="_blank">
          original
        </a>
      </p>
      <p className="mt-3 max-w-2xl">{it.summary}</p>
      <div className="mt-5">
        <AddRouteButton items={[...cartItems.values()].filter((c) => !skipped.has(c.id))} />
      </div>

      <div className="mt-10 space-y-8">
        {it.schedule.map(({ day, items }) => (
          <section key={day}>
            <h2 className="text-lg font-semibold">Day {day}</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4">
                  <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                    <p className="font-medium">
                      {item.name}
                      {item.sentiment === "MUST_VISIT" && (
                        <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 align-middle text-xs font-medium text-accent">
                          {sentimentLabel.MUST_VISIT}
                        </span>
                      )}
                      {item.sentiment === "OPTIONAL" && (
                        <span className="ml-2 rounded-full bg-line px-2 py-0.5 align-middle text-xs text-muted">
                          {sentimentLabel.OPTIONAL}
                        </span>
                      )}
                      {item.sentiment === "AVOID" && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 align-middle text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          {sentimentLabel.AVOID}
                        </span>
                      )}
                    </p>
                    {item.note && <p className="mt-0.5 text-sm text-muted">{item.note}</p>}
                    <p className="mt-0.5 text-xs text-muted">
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
                    <span className={`max-w-44 text-sm sm:text-right tabular-nums ${item.priceCents === null ? "text-muted" : ""}`}>
                      {formatPrice(item)}
                      {item.priceCents !== null && item.priceNote && (
                        <span className="block text-xs text-muted">{item.priceNote}</span>
                      )}
                      {item.priceSourceUrl && (
                        <a
                          href={item.priceSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-muted underline decoration-dotted hover:text-accent"
                          title="The creator didn't list a price; this is the typical price from this source."
                        >
                          Typical price · {new URL(item.priceSourceUrl).hostname.replace(/^www\./, "")}
                        </a>
                      )}
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
                    {item.sentiment !== "AVOID" && <AddItemButton item={cartItems.get(item.id)!} />}
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
