import Link from "next/link";
import { db } from "@/lib/db";
import { cityHealth } from "@/lib/admin/health";
import { saveDestination } from "@/lib/admin/actions";
import { Checkbox, Field, SaveButton, TextArea } from "../ui";
import { IndexNowButton } from "./indexnow-button";
import { RecheckPhotosButton } from "./recheck-photos-button";

export default async function AdminHome() {
  const destinations = await db.destination.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { itineraries: true, places: true } } },
  });
  // What still needs doing, from the same checks as City health, so you can start here instead of hunting.
  const todo = (await cityHealth()).flatMap((c) =>
    c.checks
      .filter((k) => k.done < k.total)
      .map((k) => ({ city: c.name, slug: c.slug, label: k.label, href: k.missing[0]?.href ?? `/admin/health#${c.slug}` })),
  );

  return (
    <>
      <h1 className="text-2xl font-semibold">Destinations</h1>
      <p className="mt-1 text-sm text-muted">
        Changes go live on the site as soon as you save. Open a destination to
        edit its places and itineraries.
      </p>
      <section className="mt-6 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-semibold">To do {todo.length > 0 && <span className="text-muted">· {todo.length}</span>}</h2>
        {todo.length === 0 ? (
          <p className="mt-1 text-sm text-muted">Nothing missing. Every city passes every check.</p>
        ) : (
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {todo.slice(0, 20).map((x) => (
              <li key={`${x.slug}-${x.label}`}>
                <Link href={x.href} className="hover:underline">
                  <span className="font-medium">{x.city}</span> · {x.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {todo.length > 20 && (
          <Link href="/admin/health" className="mt-2 inline-block text-sm text-accent underline">
            See all {todo.length} in City health
          </Link>
        )}
      </section>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {destinations.map((d) => (
          <li key={d.id}>
            <Link
              href={`/admin/destinations/${d.id}`}
              className="flex items-center justify-between p-4 hover:bg-line/40"
            >
              <span>
                <span className="font-medium">{d.name}</span>{" "}
                <span className="text-sm text-muted">{d.country}</span>
              </span>
              <span className="text-sm text-muted">
                {d._count.itineraries} itineraries · {d._count.places} places
              </span>
            </Link>
          </li>
        ))}
        {destinations.length === 0 && (
          <li className="p-4 text-sm text-muted">No destinations yet.</li>
        )}
      </ul>

      <details className="mt-6 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">
          Add a destination
        </summary>
        <form
          action={saveDestination}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <Field label="Name" name="name" required placeholder="Tokyo" />
          <Field
            label="Country"
            name="country"
            required
            placeholder="Japan"
            hint="Must match the eSIM plans' country."
          />
          <TextArea label="Summary" name="summary" />
          <Field
            label="URL name"
            name="slug"
            placeholder="tokyo"
            hint="Leave blank to make one from the name."
          />
          <Checkbox label="Sample (fictional demo content)" name="isSample" />
          <div>
            <SaveButton>Add destination</SaveButton>
          </div>
        </form>
      </details>

      <section className="mt-6 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-medium">Search engines</h2>
        <p className="mt-1 text-sm text-muted">
          Saving here already tells Bing (which feeds ChatGPT search and
          Copilot) which pages changed. Use this button once after moving to a
          new domain, or if you added lots of content.
        </p>
        <IndexNowButton />
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-card p-4">
        <h2 className="font-medium">Photos</h2>
        <p className="mt-1 text-sm text-muted">
          Swaps stock photos that don&apos;t show the actual place for the
          category picture. Checks 20 places per press. To use your own photo,
          paste its link first under the place&apos;s Photos.
        </p>
        <RecheckPhotosButton />
      </section>
    </>
  );
}
