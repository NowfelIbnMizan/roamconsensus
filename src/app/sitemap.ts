import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/email";
import { sitePaths } from "@/lib/site-paths";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  return (await sitePaths()).map((p) => ({ url: p === "/" ? base : `${base}${p}` }));
}
