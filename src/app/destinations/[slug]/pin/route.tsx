import { ImageResponse } from "next/og";
import { getDestination, getDestinationSlugs } from "@/lib/data";

export async function generateStaticParams() {
  return getDestinationSlugs();
}

/** A tall (2:3) Pinterest pin of a city's top picks, linked from the Top picks page's "Save to Pinterest" button. */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const d = await getDestination((await params).slug);
  if (!d) return new Response("Not found", { status: 404 });
  const top = d.consensus.filter((p) => p.category === "EXPERIENCE" && p.creators.length > 0).slice(0, 10);
  const who = d.creatorCount > 1 ? `${d.creatorCount} travel creators` : "a travel creator";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 72,
        background: "linear-gradient(180deg, #0f766e 0%, #134e4a 55%, #1c1917 100%)",
        color: "#faf8f5",
      }}
    >
      <div style={{ fontSize: 34, color: "#5eead4", textTransform: "uppercase", letterSpacing: 3 }}>{d.country}</div>
      <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.02, marginTop: 16 }}>
        {`${top.length} best things to do in ${d.name}`}
      </div>
      <div style={{ fontSize: 38, color: "#d6d3d1", marginTop: 20 }}>{`according to ${who}`}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 56, flex: 1 }}>
        {top.map((p, i) => (
          <div key={p.slug} style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 38 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                background: "#ccfbf1",
                color: "#0f766e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 600 }}>{p.name.length > 34 ? `${p.name.slice(0, 33)}…` : p.name}</div>
              {d.creatorCount > 1 && (
                <div
                  style={{ fontSize: 24, color: "#a8a29e" }}
                >{`${p.creators.length} of ${d.creatorCount} creators`}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", fontSize: 32, fontWeight: 600, color: "#ccfbf1" }}>Creatour</div>
    </div>,
    { width: 1000, height: 1500 },
  );
}
