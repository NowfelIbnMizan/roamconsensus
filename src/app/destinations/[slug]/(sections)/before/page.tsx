import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { Checklist } from "./checklist";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/before">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `${d.name} travel checklist`,
        description: `Visa, money, health and etiquette before you go to ${d.name}.`,
      }
    : {};
}

export default async function BeforePage({ params }: PageProps<"/destinations/[slug]/before">) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  if (d.tips.length === 0) return <p className="text-muted">A checklist for {d.name} is coming soon.</p>;

  const topics = [...new Set(d.tips.map((t) => t.topic))].map((topic) => ({
    topic,
    tips: d.tips.filter((t) => t.topic === topic),
  }));

  return (
    <>
      <h2 className="text-xl font-semibold">Before you go to {d.name}</h2>
      <p className="mt-1 text-sm text-muted">Tick things off as you go. Your ticks stay on this device.</p>
      <Checklist slug={d.slug} topics={topics} />
      <p className="mt-6 text-xs text-muted">Rules and fees change. Check the official links before you travel.</p>
    </>
  );
}
