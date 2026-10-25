import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import { ReadMore } from "@/components/read-more";
import Link from "next/link";
import { CreatorAvatar } from "@/components/creator-avatar";
import { CreatorSocials } from "@/components/creator";
import { getCreators } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { Thumb } from "@/components/thumb";
import { CreatorNoticeLine } from "@/components/creator-notice";
import { ArrowRight } from "lucide-react";

// Each card previews a few routes; the creator's page lists them all.
const PREVIEW = 3;

export const metadata: Metadata = {
  title: "Travel creators",
  description:
    "The travel bloggers and creators whose itineraries Creatour compares, with their bios, socials and routes.",
};

export default async function CreatorsPage() {
  const creators = await getCreators();
  const itineraryCount = creators.reduce((n, c) => n + c.itineraries.length, 0);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">The creators</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {creators.length} creators, {itineraryCount} routes. They did the
        travelling: give them a read and a follow.
      </p>
      <CreatorNoticeLine className="mt-3 max-w-2xl" />

      <PageGuide id="creators" className="mt-6" />
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {creators.map((c) => {
          const destinations = [
            ...new Map(
              c.itineraries.map((it) => [it.destination.slug, it.destination]),
            ).values(),
          ];
          return (
            <li
              key={c.handle}
              className="flex flex-col rounded-2xl border border-line bg-card p-5"
            >
              <div className="flex items-start gap-4">
                <CreatorAvatar creator={c} />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">
                    <Link
                      href={`/creators/${c.handle}`}
                      className="hover:underline"
                    >
                      {c.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted">
                    {c.itineraries.length}{" "}
                    {c.itineraries.length === 1 ? "route" : "routes"} ·{" "}
                    {destinations.length > 3
                      ? `${destinations.length} cities`
                      : destinations.map((d) => d.name).join(", ")}
                  </p>
                </div>
              </div>
              {c.bio && <ReadMore text={c.bio} className="mt-3" />}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CreatorSocials creator={c} />
              </div>
              <ul className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
                {c.itineraries.slice(0, PREVIEW).map((it) => (
                  <li key={it.slug}>
                    <Link
                      href={`/itineraries/${it.slug}`}
                      className="group flex items-center gap-3"
                    >
                      <Thumb
                        url={it.coverUrl}
                        category="EXPERIENCE"
                        className="size-12 rounded-lg"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium group-hover:underline">
                          {it.title}
                        </span>
                        <span className="text-muted">
                          {it.destination.name} · {it.days}{" "}
                          {it.days === 1 ? "day" : "days"} ·{" "}
                          {tierLabel[it.tier]}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/creators/${c.handle}`}
                className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium text-accent hover:underline"
              >
                {c.itineraries.length > PREVIEW
                  ? `All ${c.itineraries.length} routes`
                  : `About ${c.name}`}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-sm text-muted">
        Are you one of these creators? You can update your bio and links or ask
        for removal.{" "}
        <Link href="/about#for-creators" className="underline">
          Get in touch
        </Link>
        .
      </p>
    </>
  );
}
