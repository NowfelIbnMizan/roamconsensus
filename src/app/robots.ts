import type { MetadataRoute } from "next";

const base = process.env.URL ?? "https://creatour.co";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }, sitemap: `${base}/sitemap.xml` };
}
