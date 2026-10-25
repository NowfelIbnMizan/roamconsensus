import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs, getStays } from "@/lib/data";
import { costGuides } from "@/lib/costs";
import { BudgetCalculator } from "./budget-calculator";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/budget">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `${d.name} trip budget calculator`,
        description: `How much a trip to ${d.name} costs per day, for backpackers, mid-range and luxury travellers.`,
      }
    : {};
}

export default async function BudgetPage({ params }: PageProps<"/destinations/[slug]/budget">) {
  const { slug } = await params;
  const [d, stays] = await Promise.all([getDestination(slug), getStays(slug)]);
  if (!d) notFound();
  const guide = costGuides[d.slug];
  if (!guide) return <p className="text-muted">A budget calculator for {d.name} is coming soon.</p>;

  return (
    <>
      <h2 className="text-xl font-semibold">How much does {d.name} cost?</h2>
      <p className="mt-1 text-sm text-muted">Set your days and people, then compare travel styles.</p>
      <BudgetCalculator guide={guide} stays={stays} place={d.name} />
    </>
  );
}
