import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs, getEsimPlans } from "@/lib/data";
import { esimGuides, type EsimGuide } from "@/lib/esim-guides";
import { EsimTable } from "./esim-table";
import { ShieldCheck } from "lucide-react";

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

  const guide = esimGuides[destination.country];
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
      {guide && <ImeiCallout imei={guide.imei} />}
      <EsimTable plans={plans} />
      {guide && <Guide guide={guide} place={destination.name} />}
    </section>
  );
}

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

function Sources({ urls }: { urls: string[] }) {
  return (
    <p className="mt-3 text-xs text-muted">
      Sources:{" "}
      {urls.map((u, i) => (
        <span key={u}>
          {i > 0 && ", "}
          <a href={u} target="_blank" rel="noopener noreferrer" className="underline">
            {host(u)}
          </a>
        </span>
      ))}
    </p>
  );
}

function ImeiCallout({ imei }: { imei: EsimGuide["imei"] }) {
  return (
    <section className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="size-4" aria-hidden /> {imei.title}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {imei.body.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Sources urls={imei.sources} />
    </section>
  );
}

function Guide({ guide, place }: { guide: EsimGuide; place: string }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">{place} coverage &amp; signal guide</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">{guide.coverage.intro}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {guide.coverage.areas.map((a) => (
            <div key={a.name} className="rounded-xl border border-line bg-card p-4">
              <dt className="font-medium">{a.name}</dt>
              <dd className="mt-1 text-sm text-muted">{a.note}</dd>
            </div>
          ))}
        </dl>
        <Sources urls={guide.coverage.sources} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">eSIM questions</h2>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
          {guide.faq.map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                {f.q}
                <span className="float-right text-muted group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Checked {guide.checked}. Rules and coverage change; confirm with your provider.
        </p>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
