import type { Metadata } from "next";
import Link from "next/link";
import { getDestinations } from "@/lib/data";
import { visaRules } from "@/lib/visa";
import { PassportPicker, VisaResult } from "@/components/visa-check";

export const metadata: Metadata = {
  title: "Visa checker",
  description: "Pick your passport and see whether you need a visa for each destination, with official links.",
};

export default async function VisaPage() {
  const destinations = await getDestinations();
  const countries = [...new Set(destinations.filter((d) => !d.isSample).map((d) => d.country))].filter(
    (c) => visaRules[c],
  );

  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight">Do I need a visa?</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pick your passport to see the entry rules for every destination on Creatour. Your choice stays on this
        device.
      </p>
      <div className="mt-6">
        <PassportPicker />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {countries.map((country) => (
          <section key={country} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-semibold">{country}</h2>
            <p className="mb-3 text-sm text-muted">
              {destinations
                .filter((d) => d.country === country)
                .map((d, i) => (
                  <span key={d.slug}>
                    {i > 0 && ", "}
                    <Link href={`/destinations/${d.slug}/before`} className="underline">
                      {d.name}
                    </Link>
                  </span>
                ))}
            </p>
            <VisaResult country={country} rules={visaRules[country]} />
          </section>
        ))}
      </div>
    </>
  );
}
