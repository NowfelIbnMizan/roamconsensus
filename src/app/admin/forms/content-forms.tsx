import { deleteAboutPhoto, saveAboutPhoto, saveCostGuide, saveEsimGuide } from "@/lib/admin/actions";
import type { CostGuide } from "@/lib/costs";
import type { EsimGuide } from "@/lib/esim-guides";
import { Field, SaveButton, TextArea } from "../ui";
import { EditDialog } from "../edit-dialog";

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
      <div className="mt-4">
        <EditDialog title="Add a photo" add label="Add photo">
          <form action={saveAboutPhoto} className="grid gap-3 sm:grid-cols-2">
            <PhotoFields />
            <div className="sm:col-span-2">
              <SaveButton>Add photo</SaveButton>
            </div>
          </form>
        </EditDialog>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {photos.map((p) => (
          <li key={p.id} className="relative overflow-hidden rounded-xl border border-line bg-card">
            <EditDialog floating title="Edit photo" subtitle={p.caption}>
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any host */}
              <img src={p.src} alt={p.alt ?? ""} className="mb-4 max-h-60 rounded-lg object-cover" />
              <form action={saveAboutPhoto} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={p.id} />
                <PhotoFields p={p} />
                <div className="sm:col-span-2">
                  <SaveButton />
                </div>
              </form>
              <form action={deleteAboutPhoto} className="mt-3 text-right">
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="text-sm text-rose-600 hover:underline">
                  Remove this photo
                </button>
              </form>
            </EditDialog>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of any host */}
            <img src={p.src} alt={p.alt ?? ""} className="aspect-square w-full object-cover" />
            <p className="truncate p-2 text-xs text-muted">
              {p.wide ? "Wide" : "Upright"}: {p.caption}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
