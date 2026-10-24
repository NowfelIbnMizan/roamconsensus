import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  deleteItem,
  deleteItinerary,
  saveItem,
  saveItinerary,
} from "@/lib/admin/actions";
import { categoryLabel, formatPrice, sentimentLabel } from "@/lib/format";
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
        include: { links: true },
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
}: {
  item?: Item;
  places: Choice[];
  vendors: Choice[];
  nextPosition: number;
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
        defaultValue={item?.day ?? 1}
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

  return (
    <>
      <Link
        href={`/admin/destinations/${it.destinationId}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← {it.destination.name}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{it.title}</h1>
        <Link
          href={`/itineraries/${it.slug}`}
          target="_blank"
          className="text-sm text-accent underline"
        >
          View on site
        </Link>
      </div>

      <form
        action={saveItinerary}
        className="mt-4 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={it.id} />
        <Field label="Title" name="title" defaultValue={it.title} required />
        <Select
          label="Creator"
          name="creatorId"
          defaultValue={it.creatorId}
          options={creators.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          label="Budget tier"
          name="tier"
          defaultValue={it.tier}
          options={tierOptions}
        />
        <Field
          label="Days"
          name="days"
          type="number"
          defaultValue={it.days}
          required
        />
        <Field
          label="Creator's post (link)"
          name="sourceUrl"
          type="url"
          defaultValue={it.sourceUrl}
          required
        />
        <Field
          label="URL name"
          name="slug"
          defaultValue={it.slug}
          hint="Changing it breaks old links."
        />
        <TextArea label="Summary" name="summary" defaultValue={it.summary} />
        <TextArea
          label="Your take (shown as your own commentary, with your name)"
          name="editorTake"
          defaultValue={it.editorTake}
          rows={4}
        />
        <div>
          <SaveButton />
        </div>
      </form>
      <div className="mt-2 text-right">
        <DeleteButton
          action={deleteItinerary}
          id={it.id}
          what={`${it.title} and all its items`}
        />
      </div>

      <h2 className="mt-10 text-xl font-semibold">Items</h2>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {it.items.map((item) => (
          <li key={item.id}>
            <details className="p-4">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-4">
                <span>
                  <span className="text-sm text-muted">Day {item.day} · </span>
                  <span className="font-medium">{item.name}</span>
                  {item.sentiment && (
                    <span className="text-sm text-muted">
                      {" "}
                      · {sentimentLabel[item.sentiment]}
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted">
                  {categoryLabel[item.category]} · {formatPrice(item)}
                </span>
              </summary>
              <form
                action={saveItem}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="itineraryId" value={it.id} />
                <ItemFields
                  item={item}
                  places={places}
                  vendors={vendors}
                  nextPosition={nextPosition}
                />
                <div>
                  <SaveButton />
                </div>
              </form>
              <div className="mt-2 text-right">
                <DeleteButton
                  action={deleteItem}
                  id={item.id}
                  what={item.name}
                />
              </div>
            </details>
          </li>
        ))}
        {it.items.length === 0 && (
          <li className="p-4 text-sm text-muted">No items yet.</li>
        )}
      </ul>
      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Add an item</summary>
        <form action={saveItem} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="itineraryId" value={it.id} />
          <ItemFields
            places={places}
            vendors={vendors}
            nextPosition={nextPosition}
          />
          <div>
            <SaveButton>Add item</SaveButton>
          </div>
        </form>
      </details>
    </>
  );
}
