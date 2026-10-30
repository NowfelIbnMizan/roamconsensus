import { siteUrl } from "@/lib/email";

/** Search results cut descriptions at about 160 characters; end on a whole word with an ellipsis. */
export function clip(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length).replace(/[,.;:\s]+$/, "")}…`;
}

/** Breadcrumb structured data: Google shows these as the page path under the result title. */
export function breadcrumbJsonLd(crumbs: [name: string, path: string][]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: path === "/" ? siteUrl() : `${siteUrl()}${path}`,
    })),
  };
}

/** For a <script type="application/ld+json">; escapes "<" so text can't close the tag. */
export const ldJson = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
