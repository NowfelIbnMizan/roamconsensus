import type { Metadata } from "next";
import Link from "next/link";
import { canonical, clip, ldJson } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Money } from "@/components/money";
import { fullyCosted } from "@/lib/collections";
import { getDestination, getDestinationSlugs, getStays } from "@/lib/data";
import { costGuideOf, type Style } from "@/lib/costs";
import { destinationFaq, faqJsonLd } from "@/lib/faq";
import { formatMoney, tierLabel } from "@/lib/format";
import { BudgetCalculator } from "./budget-calculator";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

/** The "what does it cost" answer, from the city FAQ, so the page and its structured data say the same thing. */
const costAnswer = (d: NonNullable<Awaited<ReturnType<typeof getDestination>>>) =>
  destinationFaq(d, []).find((f) => f.q.startsWith("How much")) ?? null;

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/budget">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return {};
  const guide = costGuideOf(d)?.styles;
  const day = (s: Style) => {
    const c = guide![s];
    return formatMoney(Math.round(c.food + c.localTransport + c.activities + c.stayPerNight / 2) * 100);
  };
  return {
    title: `${d.name} trip cost: per day, by travel style`,
    // Lead with the numbers people search for; cities without a cost guide keep the plain line.
    description: guide
      ? clip(
          `A ${d.name} trip costs about ${day("backpacker")} a day as a backpacker, ${day("midrange")} mid-range and ${day("luxury")} luxury, per person. Plus what creator routes really add up to.`,
        )
      : `How much a trip to ${d.name} costs per day, for backpackers, mid-range and luxury travellers: stays, food, transport and sights.`,
    ...canonical(`/destinations/${d.slug}/budget`),
  };
}

export default async function BudgetPage({ params }: PageProps<"/destinations/[slug]/budget">) {
  const { slug } = await params;
  const [d, stays] = await Promise.all([getDestination(slug), getStays(slug)]);
  if (!d) notFound();
  const guide = costGuideOf(d);
  const answer = costAnswer(d);
  const costed = fullyCosted(d.routes).slice(0, 4);

  return (
    <>
      {answer && <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(faqJsonLd([answer]))} />}
      <h2 className="text-xl font-semibold">How much does {d.name} cost?</h2>
      {/* The answer first, then the working. */}
      {answer && <p className="mt-2 max-w-3xl text-pretty">{answer.a}</p>}
      {costed.length > 0 && (
        <section aria-labelledby="route-costs" className="mt-6">
          <h3 id="route-costs" className="font-semibold">
            What creator routes add up to
          </h3>
          <ul className="mt-2 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-card">
            {costed.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/itineraries/${r.slug}`}
                  className="group flex min-h-11 items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block font-medium group-hover:text-accent">{r.title}</span>
                    <span className="block text-sm text-muted">
                      {r.days} {r.days === 1 ? "day" : "days"} · {tierLabel[r.tier]} · {r.creator.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="block font-semibold">
                      <Money cents={Math.round(r.totalCents / r.days)} /> a day
                    </span>
                    <span className="block text-sm text-muted">
                      <Money cents={r.totalCents} /> total
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="fine-print mt-2">Per person, from routes that price a hotel and most stops.</p>
        </section>
      )}
      {guide ? (
        <>
          <h3 className="mt-8 font-semibold">Work out your own</h3>
          <p className="mt-1 text-sm text-muted">Set your days and people, then compare travel styles.</p>
          <BudgetCalculator guide={guide} stays={stays} place={d.name} />
        </>
      ) : (
        <p className="mt-6 text-muted">A budget calculator for {d.name} is coming soon.</p>
      )}
    </>
  );
}
