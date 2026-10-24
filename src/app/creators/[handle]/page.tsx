import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { getCreator, getCreatorHandles } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { CreatorSocials } from "@/components/creator";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Snapshots } from "@/components/snapshots";
import { Thumb } from "@/components/thumb";
import { CreatorNoticeLine, SupportCreator } from "@/components/creator-notice";

export async function generateStaticParams() {
  return getCreatorHandles();
}

export async function generateMetadata({ params }: PageProps<"/creators/[handle]">): Promise<Metadata> {
  const c = await getCreator((await params).handle);
  return c
    ? {
        title: c.name,
        description: c.bio ?? `${c.name}'s travel itineraries on Creatour.`,
      }
    : {};
}

export default async function CreatorPage({ params }: PageProps<"/creators/[handle]">) {
  const creator = await getCreator((await params).handle);
  if (!creator) notFound();

  const trips = creator.itineraries;
  // One polaroid per city: its cover, or the first stop photo from one of their trips there.
  const cities = [...new Map(trips.map((it) => [it.destination.slug, it])).values()];
  const shots = cities.flatMap((it) => {
    const url = it.coverUrl ?? trips.find((t) => t.destination.slug === it.destination.slug && t.photos[0])?.photos[0];
    return url
      ? [
          {
            id: it.destination.slug,
            url,
            caption: it.destination.name,
            href: `/itineraries/${it.slug}`,
          },
        ]
      : [];
  });
  const stats = [
    { value: trips.length, label: trips.length === 1 ? "trip" : "trips" },
    { value: cities.length, label: cities.length === 1 ? "city" : "cities" },
    { value: trips.reduce((n, it) => n + it.days, 0), label: "days of plans" },
    {
      value: trips.reduce((n, it) => n + it.places, 0),
      label: "places picked",
    },
  ];

  return (
    <>
      <Link href="/creators" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        All creators
      </Link>
      <div className="mt-4 flex items-center gap-4">
        <CreatorAvatar creator={creator} size="lg" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{creator.name}</h1>
          <p className="text-muted">@{creator.handle}</p>
        </div>
      </div>
      {creator.bio && <p className="mt-4 max-w-2xl">{creator.bio}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CreatorSocials creator={creator} />
      </div>
      <CreatorNoticeLine name={creator.name} className="mt-3 max-w-2xl" />

      <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-card px-4 py-3">
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <span className="block text-2xl font-semibold tabular-nums">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </dd>
          </div>
        ))}
      </dl>

      {shots.length >= 2 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Where {creator.name} has been</h2>
          <Snapshots shots={shots} />
        </section>
      )}

      <h2 className="mt-8 text-lg font-semibold">Itineraries</h2>
      <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((it) => {
          const pics = it.photos.length ? it.photos : it.coverUrl ? [it.coverUrl] : [];
          return (
            <li key={it.slug}>
              <Link
                href={`/itineraries/${it.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card transition hover:border-accent"
              >
                <div className="grid h-32 grid-cols-3 gap-0.5">
                  {pics.length ? (
                    pics.map((url, n) => (
                      <Thumb
                        key={url}
                        url={url}
                        category="EXPERIENCE"
                        sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                        // One photo fills the strip; two split 2:1; three sit side by side.
                        className={`h-full ${pics.length === 1 ? "col-span-3" : pics.length === 2 && n === 0 ? "col-span-2" : ""}`}
                      />
                    ))
                  ) : (
                    <Thumb category="EXPERIENCE" className="col-span-3 h-full" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-accent">{it.destination.name}</span>
                  <span className="mt-1 font-semibold leading-snug">{it.title}</span>
                  <span className="mt-1 text-sm text-muted">
                    {it.days} {it.days === 1 ? "day" : "days"} · {tierLabel[it.tier]} · {it.stops} stops
                  </span>
                  <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-medium text-accent">
                    See the plan <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <SupportCreator creator={creator} className="mt-10 max-w-2xl" />
    </>
  );
}
