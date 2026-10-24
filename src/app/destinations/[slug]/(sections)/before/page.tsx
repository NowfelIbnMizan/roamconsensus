import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { Checklist } from "./checklist";
import { PassportPicker, VisaResult } from "@/components/visa-check";
import { visaRules } from "@/lib/visa";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/destinations/[slug]/before">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `${d.name} travel checklist`,
        description: `Visa, money, health and etiquette before you go to ${d.name}.`,
      }
    : {};
}

export default async function BeforePage({
  params,
}: PageProps<"/destinations/[slug]/before">) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const visa = visaRules[d.country];
  const visaBox = visa && (
    <section className="mb-8 rounded-2xl border border-line bg-card p-5">
      <h2 className="text-xl font-semibold">
        Do I need a visa for {d.country}?
      </h2>
      <div className="mt-3">
        <PassportPicker />
      </div>
      <div className="mt-3">
        <VisaResult country={d.country} rules={visa} />
      </div>
    </section>
  );
  if (d.tips.length === 0)
    return (
      <>
        {visaBox}
        <p className="text-muted">A checklist for {d.name} is coming soon.</p>
      </>
    );

  const topics = [...new Set(d.tips.map((t) => t.topic))].map((topic) => ({
    topic,
    tips: d.tips.filter((t) => t.topic === topic),
  }));

  return (
    <>
      {visaBox}
      <h2 className="text-xl font-semibold">Before you go to {d.name}</h2>
      <p className="mt-1 text-sm text-muted">
        Tick as you go. Saved on this device.
      </p>
      <Checklist slug={d.slug} topics={topics} />
      <p className="fine-print mt-6">
        Rules and fees change. Check the official links before you travel.
      </p>
    </>
  );
}
