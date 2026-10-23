import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const ogSize = { width: 1200, height: 630 };

// Travel-journal palette from globals.css.
const paper = "#f5efe4";
const ink = "#2b2118";
const muted = "#6a5b45";
const teal = "#0f766e";
const rust = "#ad4a22";

const fontDir = join(process.cwd(), "src/assets/fonts");
let fonts: Promise<{ name: string; data: Buffer; weight: 600 | 700; style: "normal" | "italic" }[]> | undefined;
const loadFonts = () =>
  (fonts ??= Promise.all([
    readFile(join(fontDir, "Fraunces-SemiBold.ttf")).then((data) => ({
      name: "Fraunces",
      data,
      weight: 600 as const,
      style: "normal" as const,
    })),
    readFile(join(fontDir, "Fraunces-SemiBoldItalic.ttf")).then((data) => ({
      name: "Fraunces",
      data,
      weight: 600 as const,
      style: "italic" as const,
    })),
    readFile(join(fontDir, "Caveat-Bold.ttf")).then((data) => ({
      name: "Caveat",
      data,
      weight: 700 as const,
      style: "normal" as const,
    })),
  ]));

export type OgPhoto = { src: string | null; caption: string };

/**
 * A cached photo as a data URL, small enough for a share card. Uses only photos the site already found (never asks
 * Unsplash at build); a missing or unreachable photo leaves a blank polaroid with its caption.
 */
export async function ogPhoto(key: string, caption: string): Promise<OgPhoto> {
  const cached = await db.photoCache.findUnique({ where: { key } }).catch(() => null);
  if (!cached || cached.source === "PLACEHOLDER") return { src: null, caption };
  const url = cached.url.includes("images.unsplash.com")
    ? `${cached.url.split("?")[0]}?w=520&h=400&fit=crop&fm=jpg&q=70`
    : cached.url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpeg|png)/.test(type)) return { src: null, caption };
    return { src: `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`, caption };
  } catch {
    return { src: null, caption };
  }
}

const tilts = [-4, 3, -1.5];

function Polaroid({ photo, i, width }: { photo: OgPhoto; i: number; width: number }) {
  const h = Math.round(width * 0.77);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fffcf6",
        padding: "14px 14px 0",
        boxShadow: "0 18px 30px -18px rgba(43,33,24,0.55)",
        transform: `rotate(${tilts[i % tilts.length]}deg)`,
        position: "relative",
      }}
    >
      {/* Strip of masking tape across the top edge. */}
      <div
        style={{
          position: "absolute",
          top: -14,
          left: width / 2 - 45,
          width: 110,
          height: 30,
          background: i % 2 ? "rgba(173,74,34,0.22)" : "rgba(15,118,110,0.2)",
          transform: `rotate(${i % 2 ? 4 : -5}deg)`,
        }}
      />
      {photo.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img> only
        <img src={photo.src} width={width} height={h} style={{ objectFit: "cover" }} alt="" />
      ) : (
        <div style={{ width, height: h, background: "#e7dcc6", display: "flex" }} />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontFamily: "Caveat",
          fontSize: 34,
          color: ink,
          padding: "6px 0 10px",
        }}
      >
        {photo.caption}
      </div>
    </div>
  );
}

/**
 * The share card people see on WhatsApp, Messenger, Pinterest and X, in the site's travel-journal look: paper,
 * Fraunces headline, a handwritten note, and up to three taped polaroids.
 */
export async function ogCard({
  eyebrow,
  title,
  detail,
  photos = [],
  stamp,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  photos?: OgPhoto[];
  /** Two short lines in a round passport stamp, e.g. ["11 cities", "43 trips"]. */
  stamp?: [string, string];
}) {
  const shown = photos.slice(0, 3);
  const textWidth = shown.length ? 600 : 1000;
  const titleSize = title.length > 48 ? 54 : title.length > 30 ? 64 : 76;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: paper,
        color: ink,
        fontFamily: "Fraunces",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 22,
          right: 22,
          bottom: 22,
          border: `2px dashed rgba(106,91,69,0.35)`,
          borderRadius: 6,
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: textWidth,
          padding: "64px 0 60px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={rust} strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
          </svg>
          <div style={{ display: "flex" }}>
            Crea<span style={{ color: teal, fontStyle: "italic" }}>tour</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontFamily: "Caveat", fontSize: 40, color: rust }}>{eyebrow}</div>
          <div style={{ fontSize: titleSize, lineHeight: 1.04, letterSpacing: -1 }}>{title}</div>
          {detail && <div style={{ fontSize: 28, color: muted, lineHeight: 1.3, marginTop: 6 }}>{detail}</div>}
        </div>
        <div style={{ fontSize: 24, color: muted, display: "flex" }}>creatour.co</div>
      </div>
      {shown.length > 0 && (
        <div style={{ flex: 1, display: "flex", position: "relative" }}>
          {shown.length === 1 ? (
            <div style={{ position: "absolute", top: 90, left: 40, display: "flex" }}>
              <Polaroid photo={shown[0]} i={0} width={400} />
            </div>
          ) : (
            shown.map((p, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  display: "flex",
                  ...[
                    { top: 46, left: 10 },
                    { top: 70, left: 300 },
                    { top: 318, left: 160 },
                  ][i],
                }}
              >
                <Polaroid photo={p} i={i} width={shown.length === 2 ? 260 : 230} />
              </div>
            ))
          )}
        </div>
      )}
      {stamp && (
        <div
          style={{
            position: "absolute",
            ...(shown.length ? { left: 250, bottom: 30 } : { right: 90, bottom: 56 }),
            width: 124,
            height: 124,
            borderRadius: 999,
            border: `4px solid ${teal}`,
            color: teal,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-12deg)",
            opacity: 0.85,
            fontFamily: "Caveat",
            fontSize: 28,
            lineHeight: 1,
          }}
        >
          <div style={{ display: "flex" }}>{stamp[0]}</div>
          <div style={{ display: "flex" }}>{stamp[1]}</div>
        </div>
      )}
    </div>,
    { ...ogSize, fonts: await loadFonts() },
  );
}
