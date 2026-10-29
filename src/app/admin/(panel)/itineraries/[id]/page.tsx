import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Thumb } from "@/components/thumb";
import { cachedPhotoUrls } from "@/lib/photos";
import { placePhotoKey } from "@/lib/place";
import { EditDialog } from "../../../edit-dialog";
import { db } from "@/lib/db";
import {
  deleteItem,
  deleteItinerary,
  saveItem,
  saveItinerary,
} from "@/lib/admin/actions";
import { categoryLabel, formatPrice, sentimentLabel, tierLabel } from "@/lib/format";
import {
  categoryOptions,
  sentimentOptions,
  tierOptions,
} from "../../../options";
import { DeleteButton, Field, SaveButton, Select, TextArea } from "../../../ui";

type Item = Awaited<ReturnType<typeof load>>["items"][number];
type Choice = { value: string; label: string };

function load(id: string) {
  return db.itinerary.findUniqueOrThrow({
    where: { id },
    include: {
      destination: { include: { places: { orderBy: { name: "asc" } } } },
      items: {
        orderBy: [{ day: "asc" }, { position: "asc" }],
        include: { links: true, place: true },
      },
    },
  });
}

/** The same fields for editing an item and adding one. */
function ItemFields({
  item,
  places,
  vendors,
  nextPosition,
  day = 1,
}: {
  item?: Item;
  places: Choice[];
  vendors: Choice[];
  nextPosition: number;
  /** Day a new stop goes on. */
  day?: number;
}) {
  const ourUrl = item?.links.find((l) => l.creatorId === null)?.url;
  return (
    <>
      <Field label="Name" name="name" defaultValue={item?.name} required />
      <Select
        label="Category"
        name="category"
        defaultValue={item?.category ?? "EXPERIENCE"}
        options={categoryOptions}
      />
      <Field
        label="Day"
        name="day"
        type="number"
        defaultValue={item?.day ?? day}
        required
      />
      <Field
        label="Order in the day"
        name="position"
        type="number"
        defaultValue={item?.position ?? nextPosition}
      />
      <Select
        label="Creator's verdict"
        name="sentiment"
        defaultValue={item?.sentiment}
        options={sentimentOptions}
        blank="None"
      />
      <Select
        label="Place (for consensus)"
        name="placeId"
        defaultValue={item?.placeId}
        options={places}
        blank="None"
      />
      <Field
        label="Price"
        name="price"
        type="number"
        step="0.01"
        defaultValue={item?.priceCents == null ? "" : item.priceCents / 100}
        hint="Per unit, in the currency below. Blank = no price; 0 = free."
      />
      <Field
        label="Currency"
        name="currency"
        defaultValue={item?.currency ?? "USD"}
      />
      <Field
        label="Unit"
        name="unit"
        defaultValue={item?.unit}
        placeholder="night, day, person"
        hint="Leave blank for a one-off price."
      />
      <Field
        label="Quantity"
        name="quantity"
        type="number"
        defaultValue={item?.quantity ?? 1}
      />
      <Field
        label="Price note"
        name="priceNote"
        defaultValue={item?.priceNote}
        hint="Shown next to the price, e.g. creator's wording."
      />
      <Field
        label="Price source (link)"
        name="priceSourceUrl"
        type="url"
        defaultValue={item?.priceSourceUrl}
        hint="Set when the price is our research; shows “Typical price”."
      />
      <Select
        label="Booking site"
        name="vendorId"
        defaultValue={item?.vendorId}
        options={vendors}
        blank="None (pay on site)"
      />
      <Field
        label="Booking link (our affiliate link)"
        name="ourUrl"
        type="url"
        defaultValue={ourUrl}
        hint="Needs a booking site."
      />
      <TextArea label="Creator's tip" name="note" defaultValue={item?.note} />
    </>
  );
}

export default async function ItineraryAdmin({
  params,
}: PageProps<"/admin/itineraries/[id]">) {
  const { id } = await params;
  const exists = await db.itinerary.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) notFound();
  const [it, creators, vendorRows] = await Promise.all([
    load(id),
    db.creator.findMany({ orderBy: { name: "asc" } }),
    db.vendor.findMany({ orderBy: { name: "asc" } }),
  ]);
  const places = it.destination.places.map((p) => ({
    value: p.id,
    label: p.name,
  }));
  const vendors = vendorRows.map((v) => ({ value: v.id, label: v.name }));
  const nextPosition = it.items.length
    ? Math.max(...it.items.map((i) => i.position)) + 1
    : 0;
  const slug = it.destination.slug;
  const photos = await cachedPhotoUrls([
    `destination:${slug}`,
    ...it.items.flatMap((i) => (i.place ? [placePhotoKey(slug, i.place)] : [])),
  ]);
  const photoOf = (i: Item) =>
    i.place && !i.place.hidePhoto
      ? (i.place.photos[0] ?? photos.get(placePhotoKey(slug, i.place)))
      : null;
  const cover = photos.get(`destination:${slug}`);
  const days = Array.from(
    { length: Math.max(it.days, ...it.items.map((i) => i.day)) },
    (_, n) => n + 1,
  );
  const badge = "rounded-full px-2 py-0.5 text-xs";

  const stopForm = (item?: Item, day?: number) => (
    <form action={saveItem} className="grid gap-3 sm:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="itineraryId" value={it.id} />
      <ItemFields
        item={item}
        places={places}
        vendors={vendors}
        nextPosition={nextPosition}
        day={day}
      />
      <div className="sm:col-span-2">
        <SaveButton>{item ? "Save stop" : "Add stop"}</SaveButton>
      </div>
    </form>
  );

  return (
    <>
      <Link
        href={`/admin/destinations/${it.destinationId}#routes`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← {it.destination.name} routes
      </Link>
      <header className="relative mt-3 overflow-hidden rounded-2xl border border-line bg-card">
        {cover && (
          <Thumb url={cover} alt={it.destination.name} category="EXPERIENCE" sizes="100vw" priority className="h-36 w-full sm:h-48" />
        )}
        <div className="p-5">
          <div className="absolute right-3 top-3">
            <EditDialog title="Route details" subtitle={it.title}>
              <form action={saveItinerary} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={it.id} />
                <Field label="Title" name="title" defaultValue={it.title} required />
                <Select
                  label="Creator"
                  name="creatorId"
                  defaultValue={it.creatorId}
                  options={creators.map((c) => ({ value: c.id, label: c.name }))}
                />
                <Select label="Budget tier" name="tier" defaultValue={it.tier} options={tierOptions} />
                <Field label="Days" name="days" type="number" defaultValue={it.days} required />
                <Field label="Creator's post (link)" name="sourceUrl" type="url" defaultValue={it.sourceUrl} required />
                <Field label="URL name" name="slug" defaultValue={it.slug} hint="Changing it breaks old links." />
                <TextArea label="Summary" name="summary" defaultValue={it.summary} />
                <TextArea
                  label="Your take (shown as your own commentary, with your name)"
                  name="editorTake"
                  defaultValue={it.editorTake}
                  rows={4}
                />
                <div className="sm:col-span-2">
                  <SaveButton />
                </div>
              </form>
              <div className="mt-3 text-right">
                <DeleteButton action={deleteItinerary} id={it.id} what={`${it.title} and all its stops`} />
              </div>
            </EditDialog>
          </div>
          <p className="text-sm text-muted">
            {tierLabel[it.tier]}, {it.days} days
          </p>
          <h1 className="pr-16 font-display text-3xl sm:text-4xl">{it.title}</h1>
          {it.summary && <p className="mt-2 max-w-2xl text-muted">{it.summary}</p>}
          <Link
            href={`/itineraries/${it.slug}`}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1 text-sm text-accent underline"
          >
            View on site <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      {days.map((day) => {
        const stops = it.items.filter((i) => i.day === day);
        return (
          <section key={day} className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Day {day}</h2>
              <EditDialog title={`Add a stop to day ${day}`} label="Add stop">
                {stopForm(undefined, day)}
              </EditDialog>
            </div>
            {stops.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No stops on this day. Free day, or add one.</p>
            ) : (
              <ol className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {stops.map((item) => {
                  const unpriced = item.priceCents == null && !item.priceNote && item.sentiment !== "AVOID";
                  return (
                    <li key={item.id} className="relative flex gap-3 rounded-xl border border-line bg-card p-2.5">
                      <Thumb
                        url={photoOf(item)}
                        category={item.category}
                        className={`size-16 rounded-lg ${item.sentiment === "AVOID" || item.place?.closed ? "opacity-50 grayscale" : ""}`}
                      />
                      <div className="min-w-0 flex-1 pr-14">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="truncate text-xs text-muted">
                          {categoryLabel[item.category]}, {formatPrice(item)}
                        </p>
                        <p className="mt-1.5 flex flex-wrap gap-1">
                          {item.sentiment && <span className={`${badge} bg-line/60`}>{sentimentLabel[item.sentiment]}</span>}
                          {item.place?.closed && <span className={`${badge} bg-rose-100 text-rose-800`}>Closed</span>}
                          {!item.placeId && <span className={`${badge} bg-amber-100 text-amber-900`}>No place linked</span>}
                          {unpriced && <span className={`${badge} bg-amber-100 text-amber-900`}>No price</span>}
                        </p>
                      </div>
                      <div className="absolute right-2 top-2">
                        <EditDialog openId={`stop-${item.id}`} title={item.name} subtitle={`Day ${item.day}, ${categoryLabel[item.category]}`}>
                          {stopForm(item)}
                          <div className="mt-3 text-right">
                            <DeleteButton action={deleteItem} id={item.id} what={item.name} />
                          </div>
                        </EditDialog>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </>
  );
}
