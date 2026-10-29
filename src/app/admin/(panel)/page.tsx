import Link from "next/link";
import { db } from "@/lib/db";
import { cityHealth } from "@/lib/admin/health";
import { saveDestination } from "@/lib/admin/actions";
import { Checkbox, Field, SaveButton, TextArea } from "../ui";
import { EditDialog } from "../edit-dialog";
import { cachedPhotoUrls } from "@/lib/photos";
import { Thumb } from "@/components/thumb";
import { IndexNowButton } from "./indexnow-button";
import { RecheckPhotosButton } from "./recheck-photos-button";

export default async function AdminHome() {
  const destinations = await db.destination.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { itineraries: true, places: true } } },
  });
  // What still needs doing, from the same checks as City health, so you can start here instead of hunting.
  const health = await cityHealth();
  const covers = await cachedPhotoUrls(destinations.map((d) => `destination:${d.slug}`));
  const left = new Map(health.map((c) => [c.slug, c.checks.filter((k) => k.done < k.total).length]));
  const todo = health.flatMap((c) =>
    c.checks
      .filter((k) => k.done < k.total)
      .map((k) => ({ city: c.name, slug: c.slug, label: k.label, href: k.missing[0]?.href ?? `/admin/health#${c.slug}` })),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Cities</h1>
        <EditDialog title="Add a city" add label="Add city">
          <form action={saveDestination} className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" name="name" required placeholder="Tokyo" />
            <Field label="Country" name="country" required placeholder="Japan" hint="Must match the eSIM plans' country." />
            <TextArea label="Summary" name="summary" />
            <Field label="URL name" name="slug" placeholder="tokyo" hint="Leave blank to make one from the name." />
            <Checkbox label="Sample (fictional demo content)" name="isSample" />
            <div>
              <SaveButton>Add city</SaveButton>
            </div>
          </form>
        </EditDialog>
      </div>
      <p className="mt-1 text-sm text-muted">Open a city to edit what travellers see on it.</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {destinations.map((d) => (
          <li key={d.id}>
            <Link href={`/admin/destinations/${d.id}`} className="group block overflow-hidden rounded-xl border border-line bg-card hover:border-accent">
              <Thumb url={covers.get(`destination:${d.slug}`)} category="EXPERIENCE" sizes="(min-width: 1280px) 20vw, 45vw" className="aspect-[16/10] w-full" />
              <span className="block p-3">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-muted">{d.country}</span>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {d._count.itineraries} routes, {d._count.places} places
                </span>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${left.get(d.slug) ? "bg-amber-100 text-amber-900" : "bg-accent-soft text-accent"}`}>
                  {left.get(d.slug) ? `${left.get(d.slug)} checks to fix` : "All checks pass"}
                </span>
              </span>
            </Link>
          </li>
        ))}
        {destinations.length === 0 && <li className="text-sm text-muted">No cities yet.</li>}
      </ul>
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
