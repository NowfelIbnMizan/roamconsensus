import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Thumb } from "@/components/thumb";
import { tierLabel } from "@/lib/format";
import { Header, cover, load } from "../shared";

/** A: a shelf. Short header, then every trip as one tight row, so 11 trips fit on one phone screen. */
export default async function ShelfLab() {
  const lab = await load();
  return (
    <div className="mx-auto max-w-3xl">
      <Header lab={lab} />
      <h2 className="mt-8 text-lg font-semibold">Trips</h2>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {lab.trips.map((t) => (
          <li key={t.slug}>
            <Link href={`/itineraries/${t.slug}`} className="flex items-center gap-3 p-3 hover:bg-line/30">
              <Thumb url={cover(t)} category="EXPERIENCE" sizes="56px" className="size-14 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="text-xs font-medium tracking-wide text-accent uppercase">{t.destination.name}</span>
                <span className="block truncate font-medium">{t.title}</span>
                <span className="text-xs text-muted">
                  {t.days} {t.days === 1 ? "day" : "days"} · {tierLabel[t.tier]} · {t.stops} stops
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
