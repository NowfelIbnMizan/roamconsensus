import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { getDestinations } from "@/lib/data";
import { visaRules } from "@/lib/visa";
import { VisaList } from "@/components/visa-check";
import { PageGuide } from "@/components/page-guide";

export const metadata: Metadata = {
  title: "Visa checker",
  description: "Pick your passport and see whether you need a visa for each destination, with official links.",
};

export default async function VisaPage() {
  const destinations = (await getDestinations()).filter((d) => !d.isSample);
  const countries = [...new Set(destinations.map((d) => d.country))]
    .filter((c) => visaRules[c])
    .map((country) => ({
      country,
      rules: visaRules[country],
      cities: destinations.filter((d) => d.country === country).map(({ slug, name }) => ({ slug, name })),
    }));
  // "checked" is a month like "October 2026"; the newest one is when the list was last gone over.
  const updated = countries
    .map((c) => c.rules.checked)
    .sort((a, b) => Date.parse(`1 ${b}`) - Date.parse(`1 ${a}`))[0];

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Do I need a visa?</h1>
      <p className="mt-2 max-w-2xl text-muted">Pick your passport. Tap a country for what to sort before you fly.</p>
      {updated && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm">
          <CalendarCheck className="size-4 text-accent" aria-hidden />
          Rules last updated {updated}
        </p>
      )}
      <PageGuide id="visa" className="mt-4" />
      <VisaList countries={countries} />
    </>
  );
}
