import { CostGuideForm } from "../../../forms/content-forms";
import { costGuideOf } from "@/lib/costs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  deleteDestination,
  deletePlace,
  deleteTip,
  saveDestination,
  saveItinerary,
  saveMonths,
  savePlace,
  saveTip,
} from "@/lib/admin/actions";
import { monthNames } from "@/lib/seasons";
import { ImportBox } from "./import-box";
import { categoryLabel, tierLabel } from "@/lib/format";
import { categoryOptions, tierOptions } from "../../../options";
import {
  Checkbox,
  DeleteButton,
  Field,
  SaveButton,
  Select,
  TextArea,
  inputClass,
} from "../../../ui";

export default async function DestinationAdmin({
  params,
}: PageProps<"/admin/destinations/[id]">) {
  const { id } = await params;
  const [d, creators] = await Promise.all([
    db.destination.findUnique({
      where: { id },
      include: {
        itineraries: {
          orderBy: { title: "asc" },
          include: { creator: true, _count: { select: { items: true } } },
        },
        places: {
          orderBy: { name: "asc" },
          include: { _count: { select: { items: true } } },
        },
        months: true,
        tips: { orderBy: { position: "asc" } },
      },
    }),
    db.creator.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!d) notFound();
  const creatorOptions = creators.map((c) => ({
    value: c.id,
    label: `${c.name} (@${c.handle})`,
  }));

  return (
    <>
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">
        ← Destinations
      </Link>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{d.name}</h1>
        <Link
          href={`/destinations/${d.slug}`}
          target="_blank"
          className="text-sm text-accent underline"
        >
          View on site
        </Link>
      </div>

      <form
        action={saveDestination}
        className="mt-4 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={d.id} />
        <Field label="Name" name="name" defaultValue={d.name} required />
        <Field
          label="Country"
          name="country"
          defaultValue={d.country}
          required
        />
        <TextArea label="Summary" name="summary" defaultValue={d.summary} />
        <Field
          label="URL name"
          name="slug"
          defaultValue={d.slug}
          hint="Changing it breaks old links."
        />
        <Checkbox
          label="Sample (fictional demo content)"
          name="isSample"
          defaultChecked={d.isSample}
        />
        <div className="flex items-center gap-4">
          <SaveButton />
        </div>
      </form>
      <div className="mt-2 text-right">
        <DeleteButton
          action={deleteDestination}
          id={d.id}
          what={`${d.name} with all its itineraries and places`}
        />
      </div>

      <h2 className="mt-10 text-xl font-semibold">Itineraries</h2>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {d.itineraries.map((it) => (
          <li key={it.id}>
            <Link
              href={`/admin/itineraries/${it.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-line/40"
            >
              <span>
                <span className="font-medium">{it.title}</span>{" "}
                <span className="text-sm text-muted">
                  by {it.creator.name} · {tierLabel[it.tier]} · {it.days} days
                </span>
              </span>
              <span className="text-sm text-muted">
                {it._count.items} items
              </span>
            </Link>
          </li>
        ))}
        {d.itineraries.length === 0 && (
          <li className="p-4 text-sm text-muted">No itineraries yet.</li>
        )}
      </ul>
      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">
          Add an itinerary
        </summary>
        {creators.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Add the creator first on the{" "}
            <Link href="/admin/creators" className="underline">
              Creators
            </Link>{" "}
            page.
          </p>
        ) : (
          <form
            action={saveItinerary}
            className="mt-4 grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="destinationId" value={d.id} />
            <Field
              label="Title"
              name="title"
              required
              placeholder={`One week in ${d.name}`}
            />
            <Select label="Creator" name="creatorId" options={creatorOptions} />
            <Select
              label="Budget tier"
              name="tier"
              defaultValue="MIDRANGE"
              options={tierOptions}
            />
            <Field
              label="Days"
              name="days"
              type="number"
              defaultValue={7}
              required
            />
            <Field
              label="Creator's post (link)"
              name="sourceUrl"
              type="url"
              required
            />
            <Field
              label="URL name"
              name="slug"
              hint="Leave blank to make one from the title."
            />
            <TextArea label="Summary" name="summary" />
            <div>
              <SaveButton>Add itinerary</SaveButton>
            </div>
          </form>
        )}
      </details>

      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">
          Import itineraries (paste JSON)
        </summary>
        <ImportBox destinationId={d.id} />
      </details>

      <h2 className="mt-10 text-xl font-semibold">Best time to go</h2>
      <p className="mt-1 text-sm text-muted">
        Typical weather and crowds per month, shown on the &quot;When to
        go&quot; tab. Leave a month blank to hide it.
      </p>
      <form
        action={saveMonths}
        className="mt-3 rounded-2xl border border-line bg-card p-4"
      >
        <input type="hidden" name="destinationId" value={d.id} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted">
              <tr>
                <th className="pb-2 font-normal">Month</th>
                <th className="pb-2 font-normal">High °C</th>
                <th className="pb-2 font-normal">Low °C</th>
                <th className="pb-2 font-normal">Rain mm</th>
                <th className="pb-2 font-normal">Crowds</th>
                <th className="pb-2 font-normal">Note</th>
              </tr>
            </thead>
            <tbody>
              {monthNames.map((name, i) => {
                const m = d.months.find((x) => x.month === i + 1);
                return (
                  <tr key={name}>
                    <td className="py-1 pr-2 font-medium">{name}</td>
                    {(["highC", "lowC", "rainMm"] as const).map((k) => (
                      <td key={k} className="py-1 pr-2">
                        <input
                          name={`${k}${i + 1}`}
                          type="number"
                          defaultValue={m?.[k] ?? ""}
                          aria-label={`${name} ${k}`}
                          className={`w-20 ${inputClass}`}
                        />
                      </td>
                    ))}
                    <td className="py-1 pr-2">
                      <select
                        name={`crowd${i + 1}`}
                        defaultValue={m?.crowd ?? ""}
                        aria-label={`${name} crowds`}
                        className={inputClass}
                      >
                        <option value="">–</option>
                        <option value="LOW">Quiet</option>
                        <option value="MEDIUM">Moderate</option>
                        <option value="HIGH">Busy</option>
                      </select>
                    </td>
                    <td className="py-1">
                      <input
                        name={`note${i + 1}`}
                        defaultValue={m?.note ?? ""}
                        aria-label={`${name} note`}
                        className={inputClass}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Weather source link"
            name="climateSourceUrl"
            type="url"
            defaultValue={d.climateSourceUrl}
          />
          <div className="flex items-end">
            <SaveButton />
          </div>
        </div>
      </form>

      <h2 className="mt-10 text-xl font-semibold">Budget</h2>
      <CostGuideForm id={d.id} guide={costGuideOf(d)} />

      <h2 className="mt-10 text-xl font-semibold">Before you go</h2>
      <p className="mt-1 text-sm text-muted">
        Practical checklist on the &quot;Before you go&quot; tab: visa, money,
        health, etiquette. Same topic = same group; lower order numbers show
        first.
      </p>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {d.tips.map((t) => (
          <li key={t.id}>
            <details className="p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <span className="font-medium">{t.title}</span>
                <span className="text-sm text-muted">{t.topic}</span>
              </summary>
              <form action={saveTip} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={t.id} />
                <Field
                  label="Title"
                  name="title"
                  defaultValue={t.title}
                  required
                />
                <Field
                  label="Topic"
                  name="topic"
                  defaultValue={t.topic}
                  placeholder="Entry, Money, Health…"
                />
                <TextArea
                  label="Text"
                  name="body"
                  defaultValue={t.body}
                  rows={3}
                />
                <Field
                  label="Source link"
                  name="sourceUrl"
                  type="url"
                  defaultValue={t.sourceUrl}
                />
                <Field
                  label="Order"
                  name="position"
                  type="number"
                  defaultValue={t.position}
                />
                <div>
                  <SaveButton />
                </div>
              </form>
              <div className="mt-2 text-right">
                <DeleteButton action={deleteTip} id={t.id} what={t.title} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Add a tip</summary>
        <form action={saveTip} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="destinationId" value={d.id} />
          <Field label="Title" name="title" required />
          <Field
            label="Topic"
            name="topic"
            placeholder="Entry, Money, Health…"
          />
          <TextArea label="Text" name="body" rows={3} />
          <Field label="Source link" name="sourceUrl" type="url" />
          <Field
            label="Order"
            name="position"
            type="number"
            defaultValue={(d.tips.at(-1)?.position ?? -1) + 1}
          />
          <div>
            <SaveButton>Add tip</SaveButton>
          </div>
        </form>
      </details>

      <h2 className="mt-10 text-xl font-semibold">Places</h2>
      <p className="mt-1 text-sm text-muted">
        Spots creators recommend. Items that point at the same place count
        toward its creator consensus. A website makes the venue&apos;s own photo
        show. For the map pin, open the place in Google Maps, tap Share, copy
        the link and paste it here.
      </p>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {d.places.map((p) => (
          <li key={p.id}>
            <details className="p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-muted">
                  {categoryLabel[p.category]} · {p._count.items} items
                  {p.lat === null && " · no map pin"}
                  {p.closed && " · closed"}
                </span>
              </summary>
              <form
                action={savePlace}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={p.id} />
                <Field
                  label="Name"
                  name="name"
                  defaultValue={p.name}
                  required
                />
                <Select
                  label="Category"
                  name="category"
                  defaultValue={p.category}
                  options={categoryOptions}
                />
                <Field
                  label="Area"
                  name="area"
                  defaultValue={p.area}
                  placeholder="Ubud"
                />
                <Field
                  label="Website"
                  name="website"
                  type="url"
                  defaultValue={p.website}
                />
                <Field
                  label="Map pin (coordinates or Google Maps link)"
                  name="pin"
                  defaultValue={
                    p.lat !== null && p.lng !== null
                      ? `${p.lat}, ${p.lng}`
                      : null
                  }
                  placeholder="-8.5069, 115.2625"
                />
                <Field label="URL name" name="slug" defaultValue={p.slug} />
                <TextArea
                  label="About (1-2 sentences)"
                  name="blurb"
                  defaultValue={p.blurb}
                />
                <TextArea label="Tip" name="tip" defaultValue={p.tip} />
                <TextArea
                  label="Photos: one image link per line. The first one is the main photo."
                  name="photos"
                  defaultValue={p.photos.join("\n")}
                  rows={3}
                />
                <Checkbox
                  label="Closed for good (stays on routes, left out of costs)"
                  name="closed"
                  defaultChecked={p.closed}
                />
                <Checkbox
                  label={`I just checked it's open${p.checkedAt ? ` (last: ${p.checkedAt.toISOString().slice(0, 10)})` : ""}`}
                  name="checkedNow"
                />
                <div>
                  <SaveButton />
                </div>
              </form>
              <div className="mt-2 text-right">
                <DeleteButton action={deletePlace} id={p.id} what={p.name} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Add a place</summary>
        <form action={savePlace} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="destinationId" value={d.id} />
          <Field label="Name" name="name" required />
          <Select
            label="Category"
            name="category"
            defaultValue="EXPERIENCE"
            options={categoryOptions}
          />
          <Field label="Area" name="area" placeholder="Ubud" />
          <Field label="Website" name="website" type="url" />
          <Field
            label="Map pin (coordinates or Google Maps link)"
            name="pin"
            placeholder="-8.5069, 115.2625"
          />
          <TextArea label="About (1-2 sentences)" name="blurb" />
          <TextArea label="Tip" name="tip" />
          <div>
            <SaveButton>Add place</SaveButton>
          </div>
        </form>
      </details>
    </>
  );
}
