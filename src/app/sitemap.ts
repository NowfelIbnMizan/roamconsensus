import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/email";
import { siteEntries } from "@/lib/site-paths";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  return (await siteEntries()).map(({ path, lastModified }) => ({
    url: path === "/" ? base : `${base}${path}`,
    // Only where the database knows when the page last changed; a made-up date teaches Google to ignore them all.
    ...(lastModified ? { lastModified } : {}),
  }));
}
