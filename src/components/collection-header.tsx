import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { breadcrumbJsonLd, ldJson } from "@/lib/seo";

/** Back link, title and one line of facts for a city list page, plus its breadcrumb data. */
export function CollectionHeader({
  city,
  path,
  title,
  facts,
}: {
  city: { slug: string; name: string; country: string };
  path: string;
  title: string;
  facts: string;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldJson(
          breadcrumbJsonLd([
            ["Home", "/"],
            [city.name, `/destinations/${city.slug}`],
            [title, path],
          ]),
        )}
      />
      <Link
        href={`/destinations/${city.slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {city.name}
      </Link>
      <p className="eyebrow mt-3">{city.country}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="mt-1 text-sm text-muted">{facts}</p>
    </>
  );
}
