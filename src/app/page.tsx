import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getDestination, getDestinations, getQuizData, getSiteStats } from "@/lib/data";
import { HomeSearch } from "@/components/home-search";
import { siteUrl } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/contact";
import { ldJson, canonical } from "@/lib/seo";
import { CreatorFaces } from "@/components/creator-faces";
import {
  AgreeStrip,
  CityPills,
  CityTiles,
  ClosingBand,
  HowItWorks,
  StarterRoutes,
  TrustLine,
  pickStarters,
} from "@/components/home-sections";

export const metadata: Metadata = {
  // The bare brand name tells search nothing; lead with what the site is.
  title: { absolute: "Creatour: travel itineraries from creators, compared" },
  description:
    "See where travel creators agree. Compare their itineraries for Bali, Tokyo, Bangkok and more, then build your own day-by-day trip plan.",
  ...canonical("/"),
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${siteUrl()}/#website`, name: "Creatour", url: siteUrl() },
    {
      "@type": "Organization",
      "@id": `${siteUrl()}/#org`,
      name: "Creatour",
      url: siteUrl(),
      logo: `${siteUrl()}/icons/icon-512.png`,
      email: CONTACT_EMAIL,
      sameAs: ["https://www.instagram.com/creatour.co/", "https://www.linkedin.com/company/creatour-co/"],
    },
  ],
};

// How many cities get a photo tile on the first screen; the rest are pills under them.
const TILES = 6;

export default async function Home() {
  const [destinations, stats, quiz] = await Promise.all([getDestinations(), getSiteStats(), getQuizData()]);
  const { creators } = stats;
  // Photos only (letter circles look like a placeholder); CreatorFaces drops expired links and needs three left.
  const faces = creators.filter((c) => c.avatarUrl && !c.hideAvatar);
  const routes = destinations.reduce((n, d) => n + d._count.itineraries, 0);
  // Best-covered cities first: the first tap should land on a city with routes to compare.
  const byRoutes = [...destinations].sort(
    (a, b) => b._count.itineraries - a._count.itineraries || a.name.localeCompare(b.name),
  );
  // Show the idea, not just tell it: the most-shared places of the best-covered city.
  const lead = byRoutes[0] ? await getDestination(byRoutes[0].slug) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(siteJsonLd)} />
      <section className="pb-2 lg:pt-4">
        <Link href="/creators" className="-my-3 inline-flex items-center gap-2.5 py-3 hover:text-foreground">
          {stats.showFaces && (
            <CreatorFaces
              faces={faces.map(({ handle, name, avatarUrl }) => ({ handle, name, avatarUrl: avatarUrl! }))}
            />
          )}
          <span className="eyebrow">
            {destinations.length} {destinations.length === 1 ? "city" : "cities"} · {routes}{" "}
            {routes === 1 ? "route" : "routes"} · {creators.length} {creators.length === 1 ? "creator" : "creators"}
          </span>
        </Link>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">Where are you going?</h1>
        <p className="mt-3 max-w-xl text-muted sm:text-lg">
          Pick a city. Get day-by-day routes from travel creators, see the places most of them include, and make the
          trip yours.
        </p>
        <CityTiles cities={byRoutes.slice(0, TILES)} />
        <CityPills cities={byRoutes.slice(TILES)} label="More:" scroll />
        <div className="mt-6 grid items-end gap-x-10 gap-y-2 border-t border-line pt-2 lg:grid-cols-[minmax(0,1fr)_auto]">
          <HomeSearch cities={destinations.map(({ slug, name, country }) => ({ slug, name, country }))} />
          <div className="lg:pb-2">
            <Link
              href="/quiz"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              <Sparkles className="size-3.5" aria-hidden /> Not sure where? Find your match
            </Link>
            <TrustLine className="mt-1" />
          </div>
        </div>
        <p className="fine-print mt-4">Routes collected from what independent creators share publicly online.</p>
      </section>

      <StarterRoutes routes={pickStarters(byRoutes, quiz.routes)} total={routes} />
      {lead && <AgreeStrip city={lead} />}
      <HowItWorks />
      <ClosingBand routes={routes} />
    </>
  );
}
