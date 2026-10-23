"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * YouTube player that loads only when tapped: until then it's just the thumbnail, so the page stays fast and YouTube
 * sets no cookies (privacy-enhanced youtube-nocookie.com player).
 */
export function YouTubeEmbed({ id, title, start = 0 }: { id: string; title: string; start?: number }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ""}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0"
          aria-label={`Play: ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube's own thumbnail */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
          />
          <span className="absolute top-1/2 left-1/2 flex h-12 w-17 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-[#ff0000] text-white shadow-lg">
            <Play className="size-6 fill-current" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}
