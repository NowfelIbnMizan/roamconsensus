import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // Unsplash and Pexels resize on their own CDNs (src/lib/image-loader.ts), so Vercel's optimizer quota isn't used.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  // Other sites can't show Creatour inside a frame (stops click-tricks on buttons like "Delete account").
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      ],
    },
  ],
  // No `partialPrefetching`: it embeds a second copy of the page data in every page rendered at request time
  // (after an admin save), which pushed city and places pages past 1 MB (Bing Site Scan "HTML size is too long").
  // Search lives in the home page's "Where to?" box now; old links keep their ?q= (Next passes the query along).
  redirects: async () => [
    { source: "/search", destination: "/#plan", permanent: true },
  ],
  // Share images read their fonts from disk (src/lib/og.tsx), including when a new city or route renders at request time.
  outputFileTracingIncludes: {
    "/**/opengraph-image*": ["./src/assets/fonts/**"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
