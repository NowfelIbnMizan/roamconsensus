import type { Metadata } from "next";
import { getDestinations } from "@/lib/data";
import { visaRules } from "@/lib/visa";
import { VisaList } from "@/components/visa-check";

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

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Do I need a visa?</h1>
      <p className="mt-2 max-w-2xl text-muted">Pick your passport. Tap a country for what to sort before you fly.</p>
      <VisaList countries={countries} />
    </>
  );
}
