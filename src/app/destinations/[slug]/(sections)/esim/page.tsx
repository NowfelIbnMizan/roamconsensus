import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDestination, getDestinationSlugs, getEsimPlans } from "@/lib/data";
import { esimGuides, type EsimGuide } from "@/lib/esim-guides";
import { PlanPicker } from "./plan-picker";
import { ChevronDown, ShieldCheck, Signal, Wifi } from "lucide-react";
import type { ReactNode } from "react";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/destinations/[slug]/esim">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `${d.country} eSIM plans compared`,
        description: `Compare eSIM data plans for ${d.name}.`,
      }
    : {};
}

export default async function EsimPage({
  params,
}: PageProps<"/destinations/[slug]/esim">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();
  const plans = await getEsimPlans(destination.country);

  if (plans.length === 0) {
    return (
      <p className="text-muted">No eSIM plans for {destination.country} yet.</p>
    );
  }

  const guide = esimGuides[destination.country];
  const checked = plans.reduce(
    (latest, p) => (p.checkedAt > latest ? p.checkedAt : latest),
    plans[0].checkedAt,
  );
  return (
    <section>
      <h2 className="text-xl font-semibold">
        Get online in {destination.name}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {plans.length} eSIM plans from{" "}
        {new Set(plans.map((p) => p.provider)).size} providers. Two taps to find
        yours.
      </p>
      <PlanPicker plans={plans} />
      {guide && <Guide guide={guide} place={destination.name} />}
      <p className="fine-print mt-6">
        Prices checked{" "}
        {checked.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })}{" "}
        from provider sites: confirm before you buy.
        {guide &&
          ` Phone and signal notes checked ${guide.checked}; rules change.`}
      </p>
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
          <a
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {host(u)}
          </a>
        </span>
      ))}
    </p>
  );
}

function Fold({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-line bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-medium [&::-webkit-details-marker]:hidden">
        {icon}
        <span>{title}</span>
        <ChevronDown
          className="ml-auto size-4 shrink-0 transition group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="px-4 pb-4 text-sm">{children}</div>
    </details>
  );
}

/** Phone check, signal by area and FAQ as three folds, side by side on PC. */
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
      <div className="mt-8 grid items-start gap-3 lg:grid-cols-3">
        <Fold
          icon={
            <ShieldCheck
              className="size-4 shrink-0 text-emerald-700"
              aria-hidden
            />
          }
          title="Will my phone work?"
        >
          <p className="font-medium">{guide.imei.title}</p>
          <ul className="mt-1 space-y-1 text-muted">
            {guide.imei.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <Sources urls={guide.imei.sources} />
        </Fold>
        <Fold
          icon={<Signal className="size-4 shrink-0 text-accent" aria-hidden />}
          title={`Signal around ${place}`}
        >
          <p className="text-muted">{guide.coverage.intro}</p>
          <dl className="mt-3 space-y-2">
            {guide.coverage.areas.map((a) => (
              <div key={a.name}>
                <dt className="font-medium">{a.name}</dt>
                <dd className="text-muted">{a.note}</dd>
              </div>
            ))}
          </dl>
          <Sources urls={guide.coverage.sources} />
        </Fold>
        <Fold
          icon={<Wifi className="size-4 shrink-0 text-accent" aria-hidden />}
          title={`eSIM questions · ${guide.faq.length}`}
        >
          <dl className="space-y-3">
            {guide.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-0.5 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
        </Fold>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
