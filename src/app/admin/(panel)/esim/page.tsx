import { EsimGuideForm } from "../../forms/content-forms";
import type { EsimGuide } from "@/lib/esim-guides";
import { db } from "@/lib/db";
import { deleteEsimPlan, saveEsimPlan } from "@/lib/admin/actions";
import { DeleteButton, Field, SaveButton, Select } from "../../ui";

type Plan = Awaited<ReturnType<typeof db.esimPlan.findFirstOrThrow>>;

const hotspotOptions = [
  { value: "yes", label: "Allowed" },
  { value: "no", label: "Not allowed" },
];

function PlanFields({ p, country }: { p?: Plan; country?: string }) {
  return (
    <>
      <Field
        label="Country"
        name="country"
        defaultValue={p?.country ?? country}
        required
      />
      <Field
        label="Provider"
        name="provider"
        defaultValue={p?.provider}
        required
        placeholder="Airalo"
      />
      <Field label="Plan name" name="name" defaultValue={p?.name} required />
      <Field
        label="Data (GB)"
        name="dataGb"
        type="number"
        step="0.1"
        defaultValue={
          p ? (p.dataMb === null ? "" : +(p.dataMb / 1024).toFixed(2)) : ""
        }
        hint="Blank = unlimited."
      />
      <Field
        label="Days"
        name="days"
        type="number"
        defaultValue={p?.days ?? 7}
        required
      />
      <Field
        label="Price"
        name="price"
        type="number"
        step="0.01"
        defaultValue={p ? p.priceCents / 100 : ""}
        required
      />
      <Field
        label="Currency"
        name="currency"
        defaultValue={p?.currency ?? "USD"}
      />
      <Field
        label="Network"
        name="network"
        defaultValue={p?.network}
        placeholder="Telkomsel"
      />
      <Field
        label="Speed"
        name="speed"
        defaultValue={p?.speed}
        placeholder="4G/5G"
      />
      <Select
        label="Hotspot"
        name="hotspot"
        defaultValue={p?.hotspot == null ? "" : p.hotspot ? "yes" : "no"}
        options={hotspotOptions}
        blank="Unknown"
      />
      <Field label="Notes" name="notes" defaultValue={p?.notes} />
      <Field
        label="Buy link"
        name="url"
        type="url"
        defaultValue={p?.url}
        required
      />
      <Field
        label="Price source (link)"
        name="sourceUrl"
        type="url"
        defaultValue={p?.sourceUrl}
      />
    </>
  );
}

export default async function EsimAdmin() {
  const plans = await db.esimPlan.findMany({
    orderBy: [{ country: "asc" }, { provider: "asc" }, { priceCents: "asc" }],
  });
  const countries = [...new Set(plans.map((p) => p.country))];
  const guides = new Map((await db.esimGuide.findMany()).map((g) => [g.country, g.data as EsimGuide]));

  return (
    <>
      <h1 className="text-2xl font-semibold">eSIM plans</h1>
      <p className="mt-1 text-sm text-muted">
        Shown on the eSIM tab of every destination in that country. Saving a
        plan marks its price as checked today.
      </p>
      {countries.map((country) => (
        <section key={country} className="mt-6">
          <h2 className="text-lg font-semibold">{country}</h2>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-accent">
              {guides.has(country) ? "Edit" : "Add"} the phone and signal guide
            </summary>
            <EsimGuideForm country={country} guide={guides.get(country) ?? null} />
          </details>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
            {plans
              .filter((p) => p.country === country)
              .map((p) => (
                <li key={p.id}>
                  <details className="p-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-4">
                      <span>
                        <span className="font-medium">{p.provider}</span>{" "}
                        <span className="text-sm text-muted">{p.name}</span>
                      </span>
                      <span className="text-sm text-muted tabular-nums">
                        ${(p.priceCents / 100).toFixed(2)}
                      </span>
                    </summary>
                    <form
                      action={saveEsimPlan}
                      className="mt-4 grid gap-3 sm:grid-cols-3"
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <PlanFields p={p} />
                      <div className="self-end">
                        <SaveButton />
                      </div>
                    </form>
                    <div className="mt-2 text-right">
                      <DeleteButton
                        action={deleteEsimPlan}
                        id={p.id}
                        what={`${p.provider} ${p.name}`}
                      />
                    </div>
                  </details>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <details className="mt-6 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Add a plan</summary>
        <form action={saveEsimPlan} className="mt-4 grid gap-3 sm:grid-cols-3">
          <PlanFields country={countries[0]} />
          <div className="self-end">
            <SaveButton>Add plan</SaveButton>
          </div>
        </form>
      </details>
    </>
  );
}
