import { CostGuideForm } from "../../../forms/content-forms";
import { costGuideOf } from "@/lib/costs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
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
import { cachedPhotoUrls } from "@/lib/photos";
import { placePhotoKey } from "@/lib/place";
import { Thumb } from "@/components/thumb";
import { ImportBox } from "./import-box";
import { categoryLabel, tierLabel } from "@/lib/format";
import { categoryOptions, tierOptions } from "../../../options";
import { EditDialog } from "../../../edit-dialog";
import { AdminTabs, CardFilter } from "../../../tabs";
import {
  Checkbox,
  DeleteButton,
  Field,
  SaveButton,
  Select,
  TextArea,
  inputClass,
} from "../../../ui";

const grid = "grid gap-3 sm:grid-cols-2";
const badge = "rounded-full px-2 py-0.5 text-xs";

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
  const photos = await cachedPhotoUrls([
    `destination:${d.slug}`,
    ...d.places.map((p) => placePhotoKey(d.slug, p)),
  ]);
  const cover = photos.get(`destination:${d.slug}`);

  // What a place card flags, so "Needs fixing" can find them.
  const placeIssues = (p: (typeof d.places)[number]) =>
    [
      p.lat === null && "No map pin",
      !p.checkedAt && "Not checked open",
      (p.category === "STAY" || p.category === "FOOD") && !p.website && "No website",
    ].filter((x): x is string => !!x);
  const toFix = d.places.filter((p) => placeIssues(p).length > 0).length;
  const monthsFilled = d.months.length;
  const budgetSet = costGuideOf(d) !== null;

  const placeForm = (p?: (typeof d.places)[number]) => (
    <form action={savePlace} className={grid}>
      {p ? (
        <input type="hidden" name="id" value={p.id} />
      ) : (
        <input type="hidden" name="destinationId" value={d.id} />
      )}
      <Field label="Name" name="name" defaultValue={p?.name} required />
      <Select
        label="Category"
        name="category"
        defaultValue={p?.category ?? "EXPERIENCE"}
        options={categoryOptions}
      />
      <Field label="Area" name="area" defaultValue={p?.area} placeholder="Ubud" />
      <Field label="Website" name="website" type="url" defaultValue={p?.website} />
      <Field
        label="Map pin"
        name="pin"
        defaultValue={
          p && p.lat !== null && p.lng !== null ? `${p.lat}, ${p.lng}` : null
        }
        placeholder="-8.5069, 115.2625"
        hint="In Google Maps tap Share, copy the link, paste it here."
      />
      {p && <Field label="URL name" name="slug" defaultValue={p.slug} />}
      <TextArea label="About (1-2 sentences)" name="blurb" defaultValue={p?.blurb} />
      <TextArea label="Tip" name="tip" defaultValue={p?.tip} />
      {p && (
        <>
          <TextArea
            label="Photos: one image link per line. The first one is the main photo."
            name="photos"
            defaultValue={p.photos.join("\n")}
            rows={3}
          />
          <Checkbox
            label="Hide photo (show the category icon instead)"
            name="hidePhoto"
            defaultChecked={p.hidePhoto}
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
        </>
      )}
      <div className="sm:col-span-2">
        <SaveButton>{p ? "Save place" : "Add place"}</SaveButton>
      </div>
    </form>
  );

  const tipForm = (t?: (typeof d.tips)[number]) => (
    <form action={saveTip} className={grid}>
      {t ? (
        <input type="hidden" name="id" value={t.id} />
      ) : (
        <input type="hidden" name="destinationId" value={d.id} />
      )}
      <Field label="Title" name="title" defaultValue={t?.title} required />
      <Field
        label="Topic"
        name="topic"
        defaultValue={t?.topic}
        placeholder="Entry, Money, Health…"
      />
      <TextArea label="Text" name="body" defaultValue={t?.body} rows={4} />
      <Field label="Source link" name="sourceUrl" type="url" defaultValue={t?.sourceUrl} />
      <Field
        label="Order"
        name="position"
        type="number"
        defaultValue={t?.position ?? (d.tips.at(-1)?.position ?? -1) + 1}
        hint="Lower numbers show first."
      />
      <div className="sm:col-span-2">
        <SaveButton>{t ? "Save tip" : "Add tip"}</SaveButton>
      </div>
    </form>
  );

  const routes = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Each route opens on its own page with its stops.</p>
        <div className="flex gap-2">
          <EditDialog title="Import routes" subtitle="Paste the JSON for one or more routes." label="Import" >
            <ImportBox destinationId={d.id} />
          </EditDialog>
          <EditDialog title="Add a route" add label="Add route">
            {creators.length === 0 ? (
              <p className="text-sm text-muted">
                Add the creator first on the{" "}
                <Link href="/admin/creators" className="underline">Creators</Link> page.
              </p>
            ) : (
              <form action={saveItinerary} className={grid}>
                <input type="hidden" name="destinationId" value={d.id} />
                <Field label="Title" name="title" required placeholder={`One week in ${d.name}`} />
                <Select label="Creator" name="creatorId" options={creatorOptions} />
                <Select label="Budget tier" name="tier" defaultValue="MIDRANGE" options={tierOptions} />
                <Field label="Days" name="days" type="number" defaultValue={7} required />
                <Field label="Creator's post (link)" name="sourceUrl" type="url" required />
                <Field label="URL name" name="slug" hint="Leave blank to make one from the title." />
                <TextArea label="Summary" name="summary" />
                <div className="sm:col-span-2">
                  <SaveButton>Add route</SaveButton>
                </div>
              </form>
            )}
          </EditDialog>
        </div>
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {d.itineraries.map((it) => (
          <li key={it.id} className="relative rounded-2xl border border-line bg-card p-4">
            <Link
              href={`/admin/itineraries/${it.id}`}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-xs font-medium shadow-sm hover:border-accent"
            >
              <Pencil className="size-3" aria-hidden /> Edit
            </Link>
            <p className="pr-16 font-medium">{it.title}</p>
            <p className="mt-1 text-sm text-muted">{it.creator.name}</p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              <span className={`${badge} bg-line/60`}>{it.days} days</span>
              <span className={`${badge} bg-line/60`}>{tierLabel[it.tier]}</span>
              <span className={`${badge} bg-line/60`}>{it._count.items} stops</span>
            </p>
          </li>
        ))}
      </ul>
      {d.itineraries.length === 0 && <p className="mt-3 text-sm text-muted">No routes yet.</p>}
    </>
  );

  const places = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <CardFilter target="admin-places" fixCount={toFix} />
        </div>
        <EditDialog title="Add a place" add label="Add place">
          {placeForm()}
        </EditDialog>
      </div>
      <ul id="admin-places" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {d.places.map((p) => {
          const issues = placeIssues(p);
          return (
            <li
              key={p.id}
              data-search={`${p.name} ${p.area ?? ""} ${categoryLabel[p.category]}`.toLowerCase()}
              data-fix={issues.length ? "1" : "0"}
              className="relative overflow-hidden rounded-xl border border-line bg-card"
            >
              <EditDialog
                floating
                openId={`place-${p.id}`}
                title={p.name}
                subtitle={`${categoryLabel[p.category]}, on ${p._count.items} route stop${p._count.items === 1 ? "" : "s"}`}
              >
                {placeForm(p)}
                <div className="mt-3 text-right">
                  <DeleteButton action={deletePlace} id={p.id} what={p.name} />
                </div>
              </EditDialog>
              <Thumb
                url={p.hidePhoto ? null : (p.photos[0] ?? photos.get(placePhotoKey(d.slug, p)))}
                category={p.category}
                sizes="(min-width: 1280px) 20vw, 45vw"
                className={`aspect-[4/3] w-full ${p.closed ? "grayscale" : ""}`}
              />
              <div className="p-3">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs text-muted">{p.area ?? categoryLabel[p.category]}</p>
                {(issues.length > 0 || p.closed || p.hidePhoto) && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {p.closed && <span className={`${badge} bg-rose-100 text-rose-800`}>Closed</span>}
                    {p.hidePhoto && <span className={`${badge} bg-line/60`}>Photo hidden</span>}
                    {issues.map((x) => (
                      <span key={x} className={`${badge} bg-amber-100 text-amber-900`}>{x}</span>
                    ))}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );

  const tips = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Visa, money, health, etiquette. Same topic shows as one group.</p>
        <EditDialog title="Add a tip" add label="Add tip">
          {tipForm()}
        </EditDialog>
      </div>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {d.tips.map((t) => (
          <li key={t.id} className="relative rounded-2xl border border-line bg-card p-4">
            <div className="absolute right-3 top-3">
              <EditDialog title={t.title} subtitle={t.topic}>
                {tipForm(t)}
                <div className="mt-3 text-right">
                  <DeleteButton action={deleteTip} id={t.id} what={t.title} />
                </div>
              </EditDialog>
            </div>
            {t.topic && <p className="text-xs text-muted">{t.topic}</p>}
            <p className="pr-16 font-medium">{t.title}</p>
            <p className="mt-1 line-clamp-3 text-sm text-muted">{t.body}</p>
          </li>
        ))}
      </ul>
    </>
  );

  const when = (
    <form action={saveMonths} className="rounded-2xl border border-line bg-card p-4">
      <p className="text-sm text-muted">
        Typical weather and crowds per month. Leave a month blank to hide it.
      </p>
      <input type="hidden" name="destinationId" value={d.id} />
      <div className="mt-3 overflow-x-auto">
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
  );

  return (
    <>
      <header className="relative overflow-hidden rounded-2xl border border-line bg-card">
        {cover && (
          <Thumb url={cover} category="EXPERIENCE" sizes="100vw" priority className="h-40 w-full sm:h-56" />
        )}
        <div className="p-5">
          <div className="absolute right-3 top-3">
            <EditDialog title={`${d.name} details`}>
              <form action={saveDestination} className={grid}>
                <input type="hidden" name="id" value={d.id} />
                <Field label="Name" name="name" defaultValue={d.name} required />
                <Field label="Country" name="country" defaultValue={d.country} required />
                <TextArea label="Summary" name="summary" defaultValue={d.summary} rows={3} />
                <Field label="URL name" name="slug" defaultValue={d.slug} hint="Changing it breaks old links." />
                <Checkbox label="Sample (fictional demo content)" name="isSample" defaultChecked={d.isSample} />
                <div className="sm:col-span-2">
                  <SaveButton />
                </div>
              </form>
              <div className="mt-3 text-right">
                <DeleteButton
                  action={deleteDestination}
                  id={d.id}
                  what={`${d.name} with all its itineraries and places`}
                />
              </div>
            </EditDialog>
          </div>
          <p className="text-sm text-muted">{d.country}</p>
          <h1 className="font-display text-4xl">{d.name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{d.summary}</p>
          <Link
            href={`/destinations/${d.slug}`}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1 text-sm text-accent underline"
          >
            View on site <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <AdminTabs
        tabs={[
          { id: "places", label: "Places", count: d.places.length, warn: toFix > 0, panel: places },
          { id: "routes", label: "Routes", count: d.itineraries.length, panel: routes },
          { id: "tips", label: "Before you go", count: d.tips.length, warn: d.tips.length < 12, panel: tips },
          { id: "when", label: "When to go", warn: monthsFilled < 12, panel: when },
          {
            id: "budget",
            label: "Budget",
            warn: !budgetSet,
            panel: <CostGuideForm id={d.id} guide={costGuideOf(d)} />,
          },
        ]}
      />
    </>
  );
}
