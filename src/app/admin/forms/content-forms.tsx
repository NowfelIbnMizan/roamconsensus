import { deleteAboutPhoto, saveAboutPhoto, saveCostGuide, saveEsimGuide } from "@/lib/admin/actions";
import type { CostGuide } from "@/lib/costs";
import type { EsimGuide } from "@/lib/esim-guides";
import { Field, SaveButton, TextArea } from "../ui";

const box = "mt-4 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2";
const STYLE_ROWS = [
  ["backpacker", "Backpacker / budget"],
  ["midrange", "Mid-range"],
  ["luxury", "Luxury"],
] as const;

/** The city's Budget tab: typical USD per person per day, and a room per night, for each travel style. */
export function CostGuideForm({ id, guide }: { id: string; guide: CostGuide | null }) {
  return (
    <form action={saveCostGuide} className={box}>
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-muted sm:col-span-2">
        USD per person per day (room: per night). Use a source; never guess. All zeros = no Budget tab numbers.
      </p>
      {STYLE_ROWS.map(([key, label]) => (
        <fieldset key={key} className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-5 sm:items-end">
          <legend className="mb-1 text-sm font-medium">{label}</legend>
          {(["food", "localTransport", "activities", "stayPerNight"] as const).map((f) => (
            <Field
              key={f}
              label={{ food: "Food", localTransport: "Getting around", activities: "Activities", stayPerNight: "Room / night" }[f]}
              name={`${key}.${f}`}
              type="number"
              step="any"
              defaultValue={guide?.styles[key][f] ?? ""}
            />
          ))}
        </fieldset>
      ))}
      <Field label="Checked (month and year)" name="checked" defaultValue={guide?.checked ?? ""} placeholder="October 2026" />
      <TextArea label="Source links, one per line" name="sources" defaultValue={guide?.sources.join("\n") ?? ""} rows={2} />
      <div className="sm:col-span-2">
        <SaveButton />
      </div>
    </form>
  );
}

/** Phone and signal notes shown under a country's eSIM plans. */
export function EsimGuideForm({ country, guide }: { country: string; guide: EsimGuide | null }) {
  return (
    <form action={saveEsimGuide} className={box}>
      <input type="hidden" name="country" value={country} />
      <Field label="Checked (month and year)" name="checked" defaultValue={guide?.checked ?? ""} />
      <Field label="Phone registration: heading" name="imeiTitle" defaultValue={guide?.imei.title ?? ""} />
      <TextArea label="Phone registration: points, one per line" name="imeiBody" defaultValue={guide?.imei.body.join("\n") ?? ""} rows={4} />
      <TextArea label="Phone registration: source links, one per line" name="imeiSources" defaultValue={guide?.imei.sources.join("\n") ?? ""} rows={2} />
      <TextArea label="Signal: intro" name="coverageIntro" defaultValue={guide?.coverage.intro ?? ""} rows={3} />
      <TextArea
        label="Signal by area, one per line as Area: note"
        name="areas"
        defaultValue={guide?.coverage.areas.map((a) => `${a.name}: ${a.note}`).join("\n") ?? ""}
        rows={5}
      />
      <TextArea label="Signal: source links, one per line" name="coverageSources" defaultValue={guide?.coverage.sources.join("\n") ?? ""} rows={2} />
      <TextArea
        label="Questions: question on one line, answer below, blank line between"
        name="faq"
        defaultValue={guide?.faq.map((f) => `${f.q}\n${f.a}`).join("\n\n") ?? ""}
        rows={8}
      />
      <div className="sm:col-span-2">
        <SaveButton />
      </div>
    </form>
  );
}

type Photo = { id: string; src: string; alt: string; caption: string; wide: boolean; position: number };

function PhotoFields({ p }: { p?: Photo }) {
  return (
    <>
      <Field label="Image link" name="src" type="text" defaultValue={p?.src} required hint="A direct image link (Imgur works; Google Drive doesn't)." />
      <Field label="Caption" name="caption" defaultValue={p?.caption} placeholder="Ramen stop · Hanoi, Vietnam" />
      <Field label="Describe it (for screen readers)" name="alt" defaultValue={p?.alt} />
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Shape</span>
        <select name="shape" defaultValue={p?.wide ? "wide" : "tall"} className="rounded-lg border border-line bg-background px-3 py-2">
          <option value="tall">Upright (taller than wide)</option>
          <option value="wide">Wide (wider than tall)</option>
        </select>
      </label>
      <Field label="Order" name="position" type="number" defaultValue={p?.position ?? 0} />
    </>
  );
}

/** About page photos: add, edit or remove. Others' faces should be blurred and location data stripped first. */
export function AboutPhotosForm({ photos }: { photos: Photo[] }) {
  return (
    <>
      <form action={saveAboutPhoto} className={box}>
        <p className="font-medium sm:col-span-2">Add a photo</p>
        <PhotoFields />
        <div className="sm:col-span-2">
          <SaveButton />
        </div>
      </form>
      <ul className="mt-4 space-y-2">
        {photos.map((p) => (
          <li key={p.id}>
            <details className="rounded-2xl border border-line bg-card p-3">
              <summary className="flex cursor-pointer items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any host */}
                <img src={p.src} alt="" className="size-10 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate">{p.caption}</span>
                <span className="text-muted">{p.wide ? "Wide" : "Upright"}</span>
              </summary>
              <form action={saveAboutPhoto} className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={p.id} />
                <PhotoFields p={p} />
                <div className="sm:col-span-2">
                  <SaveButton />
                </div>
              </form>
              <form action={deleteAboutPhoto} className="mt-2">
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="text-sm text-red-700 underline dark:text-red-400">
                  Remove this photo
                </button>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
