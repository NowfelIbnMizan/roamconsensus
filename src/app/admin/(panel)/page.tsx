import Link from "next/link";
import { db } from "@/lib/db";
import { saveDestination } from "@/lib/admin/actions";
import { Checkbox, Field, SaveButton, TextArea } from "../ui";

export default async function AdminHome() {
  const destinations = await db.destination.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { itineraries: true, places: true } } },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Destinations</h1>
      <p className="mt-1 text-sm text-muted">
        Changes go live on the site as soon as you save. Open a destination to edit its places and itineraries.
      </p>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {destinations.map((d) => (
          <li key={d.id}>
            <Link
              href={`/admin/destinations/${d.id}`}
              className="flex items-center justify-between p-4 hover:bg-line/40"
            >
              <span>
                <span className="font-medium">{d.name}</span> <span className="text-sm text-muted">{d.country}</span>
              </span>
              <span className="text-sm text-muted">
                {d._count.itineraries} itineraries · {d._count.places} places
              </span>
            </Link>
          </li>
        ))}
        {destinations.length === 0 && <li className="p-4 text-sm text-muted">No destinations yet.</li>}
      </ul>

      <details className="mt-6 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Add a destination</summary>
        <form action={saveDestination} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name" name="name" required placeholder="Tokyo" />
          <Field
            label="Country"
            name="country"
            required
            placeholder="Japan"
            hint="Must match the eSIM plans' country."
          />
          <TextArea label="Summary" name="summary" />
          <Field label="URL name" name="slug" placeholder="tokyo" hint="Leave blank to make one from the name." />
          <Checkbox label="Sample (fictional demo content)" name="isSample" />
          <div>
            <SaveButton>Add destination</SaveButton>
          </div>
        </form>
      </details>
    </>
  );
}
