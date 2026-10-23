import Link from "next/link";
import type { ReactNode } from "react";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { youtubeId, youtubeStart } from "@/lib/youtube";

/**
 * Small Markdown renderer for blog posts: ## and ### headings, paragraphs, - and 1. lists, > quotes, images and
 * YouTube links on their own line, **bold**, *italic* and [links](url). Builds React elements (never raw HTML), so a
 * post can't inject scripts.
 */
export function Markdown({ source }: { source: string }) {
  const blocks = source
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/);
  return <div className="space-y-4 leading-relaxed">{blocks.map((b, i) => block(b.trim(), i))}</div>;
}

const safeUrl = (url: string) => (/^(https?:\/\/|\/|#|mailto:)/i.test(url) ? url : null);

function block(text: string, key: number): ReactNode {
  const lines = text.split("\n");
  const heading = text.match(/^(#{2,3})\s+(.*)$/);
  if (heading && lines.length === 1) {
    const Tag = heading[1].length === 2 ? "h2" : "h3";
    return (
      <Tag key={key} className={Tag === "h2" ? "pt-4 text-2xl font-semibold" : "pt-2 text-xl font-semibold"}>
        {inline(heading[2])}
      </Tag>
    );
  }
  const video = lines.length === 1 ? youtubeId(text) : null;
  if (video) return <YouTubeEmbed key={key} id={video} title="Video" start={youtubeStart(text)} />;
  const image = text.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
  if (image && safeUrl(image[2])) {
    return (
      <figure key={key}>
        {/* eslint-disable-next-line @next/next/no-img-element -- authors paste images from any site */}
        <img src={image[2]} alt={image[1]} loading="lazy" className="w-full rounded-2xl" />
        {image[1] && <figcaption className="mt-1 text-center text-xs text-muted">{image[1]}</figcaption>}
      </figure>
    );
  }
  if (lines.every((l) => /^[-*]\s+/.test(l)))
    return (
      <ul key={key} className="list-disc space-y-1 pl-6">
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^[-*]\s+/, ""))}</li>
        ))}
      </ul>
    );
  if (lines.every((l) => /^\d+[.)]\s+/.test(l)))
    return (
      <ol key={key} className="list-decimal space-y-1 pl-6">
        {lines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\d+[.)]\s+/, ""))}</li>
        ))}
      </ol>
    );
  if (lines.every((l) => l.startsWith(">")))
    return (
      <blockquote key={key} className="border-l-2 border-accent pl-4 text-muted italic">
        {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "))}
      </blockquote>
    );
  return (
    <p key={key}>
      {lines.map((l, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {inline(l)}
        </span>
      ))}
    </p>
  );
}

/** **bold**, *italic* and [text](url) inside a line. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${m.index}`;
    if (m[1] !== undefined) out.push(<strong key={key}>{inline(m[1])}</strong>);
    else if (m[2] !== undefined) out.push(<em key={key}>{inline(m[2])}</em>);
    else {
      const url = safeUrl(m[4]);
      if (!url) out.push(m[3]);
      else if (url.startsWith("/"))
        out.push(
          <Link key={key} href={url} className="text-accent underline">
            {m[3]}
          </Link>,
        );
      else
        out.push(
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="text-accent underline">
            {m[3]}
          </a>,
        );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
