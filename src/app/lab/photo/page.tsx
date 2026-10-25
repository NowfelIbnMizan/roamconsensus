import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/photo";
import { HomeSearch } from "@/components/home-search";
import { getDestinations, getSiteStats } from "@/lib/data";

export default async function PhotoFirst() {
  const [destinations, stats] = await Promise.all([
    getDestinations(),
    getSiteStats(),
  ]);
  const top = [...destinations].sort(
    (a, b) => b._count.itineraries - a._count.itineraries,
  )[0];
  return (
    <section className="relative -mx-4 -mt-6 flex min-h-[78svh] flex-col justify-end px-4 pt-24 pb-6 sm:mx-0 sm:-mt-4 sm:min-h-[560px] sm:px-10 sm:pb-10">
      <div className="absolute inset-0 overflow-hidden sm:rounded-3xl">
        <Photo
          photoKey={`destination:${top.slug}`}
          query={`${top.name} ${top.country}`}
          category="DESTINATION"
          alt=""
          sizes="100vw"
          credit={false}
          priority
          className="size-full"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
      </div>
      <div className="relative">
        <Link
          href={`/destinations/${top.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/85 uppercase hover:text-white"
        >
          {top.name} · {top._count.itineraries} creator routes
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Plan from the routes creators{" "}
          <em className="font-medium text-[#9fe3d6]">agree</em> on.
        </h1>
        <p className="mt-3 max-w-lg text-white/85">
          {stats.creators.length} travel creators, {destinations.length} cities,
          one trip plan.
        </p>
        <HomeSearch
          cities={destinations.map(({ slug, name, country }) => ({
            slug,
            name,
            country,
          }))}
        />
      </div>
    </section>
  );
}
