import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCreator, getCreatorHandles } from "@/lib/data";
import { CreatorSocials } from "@/components/creator";
import { CreatorAvatar } from "@/components/creator-avatar";
import { CreatorTrips } from "@/components/creator-trips";
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
  const cities = new Set(trips.map((it) => it.destination.slug)).size;
  const days = trips.reduce((n, it) => n + it.days, 0);

  return (
    <>
      <Link href="/creators" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden />
        All creators
      </Link>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-10">
        <div>
          <div className="mt-3 flex items-center gap-4">
            <CreatorAvatar creator={creator} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{creator.name}</h1>
              <p className="text-sm text-muted">
                {trips.length} {trips.length === 1 ? "trip" : "trips"} · {cities} {cities === 1 ? "city" : "cities"} ·{" "}
                {days} days of plans
              </p>
            </div>
          </div>
          {creator.bio && <p className="mt-3 max-w-2xl text-pretty">{creator.bio}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CreatorSocials creator={creator} />
          </div>
          <CreatorNoticeLine name={creator.name} className="mt-3 max-w-2xl" />
        </div>
        <SupportCreator creator={creator} notice={false} className="mt-8 lg:mt-3" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{cities > 1 ? "Where are you going?" : "Their plan"}</h2>
        <CreatorTrips trips={trips} />
      </section>
    </>
  );
}
