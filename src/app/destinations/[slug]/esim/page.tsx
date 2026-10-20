import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs, getEsimPlans } from "@/lib/data";
import { EsimTable } from "./esim-table";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/esim">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: `${d.country} eSIM plans compared`, description: `Compare eSIM data plans for ${d.name}.` } : {};
}

export default async function EsimPage({ params }: PageProps<"/destinations/[slug]/esim">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();
  const plans = await getEsimPlans(destination.country);

  if (plans.length === 0) {
    return <p className="text-muted">No eSIM plans for {destination.country} yet.</p>;
  }

  const checked = plans.reduce((latest, p) => (p.checkedAt > latest ? p.checkedAt : latest), plans[0].checkedAt);
  return (
    <section>
      <h2 className="text-xl font-semibold">{destination.country} eSIM plans</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {plans.length} plans from {new Set(plans.map((p) => p.provider)).size} providers that work across{" "}
        {destination.country}, including {destination.name}. Prices checked{" "}
        {checked.toLocaleDateString("en-US", { month: "long", year: "numeric" })}; providers change them often, so
        confirm before you buy.
      </p>
      <EsimTable plans={plans} />
    </section>
  );
}
