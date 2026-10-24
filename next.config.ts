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
  partialPrefetching: true,
  // Share images read their fonts from disk (src/lib/og.tsx), including when a new city or route renders at request time.
  outputFileTracingIncludes: { "/**/opengraph-image*": ["./src/assets/fonts/**"] },
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
