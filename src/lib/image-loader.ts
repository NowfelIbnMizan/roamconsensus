/**
 * next/image loader that asks Unsplash and Pexels for the right width themselves (both resize on their own CDNs for
 * free), so no image goes through Vercel's optimizer and its monthly transformation quota. Anything else loads as-is.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (/^https:\/\/images\.(unsplash|pexels)\.com\//.test(src)) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", src.includes("pexels") ? "compress" : "format");
    if (src.includes("unsplash")) url.searchParams.set("fit", "max");
    if (src.includes("pexels")) url.searchParams.delete("h");
    return url.href;
  }
  return src;
}
