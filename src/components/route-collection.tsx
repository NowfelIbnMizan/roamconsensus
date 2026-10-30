import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RouteCard } from "@/components/post-routes";
import { sharedPlaces } from "@/lib/collections";
import { getPostsForRoute, type getDestination } from "@/lib/data";
import { getEditor } from "@/lib/editor";
import { placeHref } from "@/lib/place";
import { kindEyebrow } from "@/lib/post-kinds";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;

/** A set of a city's routes: the cards, the places they agree on, and the owner's posts about them. */
export async function RouteCollection({ d, routes }: { d: Destination; routes: Destination["routes"] }) {
  const [editor, posts] = await Promise.all([getEditor(), Promise.all(routes.map((r) => getPostsForRoute(r.slug)))]);
  const shared = sharedPlaces(d, routes);
  const takes = [...new Map(posts.flat().map((p) => [p.slug, p])).values()];
  return (
    <>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {routes.map((r) => (
          <RouteCard key={r.slug} route={r} />
        ))}
      </div>
      {takes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">{editor.name}&apos;s notes on these routes</h2>
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">
            {takes.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 hover:border-accent"
                >
                  <span>
                    <span className="eyebrow block">{kindEyebrow(p.kind, editor.name)}</span>
                    <span className="font-semibold">{p.title}</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-accent" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Where these routes agree</h2>
        {shared.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {shared.map((p) => (
              <li key={p.slug}>
                <Link
                  href={placeHref(d.slug, p.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm hover:border-accent"
                >
                  {p.name}
                  <span className="text-xs text-muted">
                    {p.routes} of {routes.length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">These routes don&apos;t share any places: each one goes its own way.</p>
        )}
      </section>
    </>
  );
}
