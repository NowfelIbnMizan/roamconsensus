import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { SampleBanner } from "@/components/sample-banner";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { categoryLabel, formatMoney, tierLabel } from "@/lib/format";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: `${d.name} itineraries compared`, description: d.summary } : {};
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();
  const { creatorCount } = destination;

  return (
    <>
      {destination.isSample && <SampleBanner />}
      <p className="text-sm text-muted">{destination.country}</p>
      <h1 className="text-4xl font-semibold tracking-tight">{destination.name}</h1>
      <p className="mt-3 max-w-2xl text-muted">{destination.summary}</p>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="size-5 text-accent" aria-hidden /> Creator consensus
        </h2>
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
          {destination.consensus.map((p) => {
            const all = p.creators.length === creatorCount;
            return (
              <li key={p.slug} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {p.name} <span className="ml-1 text-xs text-muted">{categoryLabel[p.category]}</span>
                  </p>
                  {p.tip && <p className="text-sm text-muted">{p.tip}</p>}
                  <p className="text-xs text-muted">{p.creators.map((c) => c.name).join(", ")}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-3 py-1 text-sm font-medium sm:self-center ${
                    all ? "bg-accent-soft text-accent" : "bg-line text-muted"
                  }`}
                >
                  {all && <CheckCircle2 className="size-4" aria-hidden />}
                  {p.creators.length}/{creatorCount} creators
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Compare routes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {destination.routes.map((r) => (
            <Link
              key={r.slug}
              href={`/itineraries/${r.slug}`}
              className="flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:border-accent"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-accent">{tierLabel[r.tier]}</span>
              <h3 className="mt-1 font-semibold">{r.title}</h3>
              <p className="text-sm text-muted">
                by {r.creator.name} · {r.days} days
              </p>
              <p className="mt-3 text-2xl font-semibold">{formatMoney(r.totalCents)}</p>
              <p className="mb-4 text-xs text-muted">est. per person</p>
              <div className="mt-auto">
                <AllocationBar allocation={r.allocation} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
