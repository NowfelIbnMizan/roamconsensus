import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** The share card people see on WhatsApp, Pinterest, Facebook and X: brand, a big headline, a line of detail. */
export function ogCard({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #0f766e 0%, #134e4a 60%, #1c1917 100%)",
        color: "#faf8f5",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 600 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#ccfbf1",
            color: "#0f766e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
        >
          C
        </div>
        Creatour
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 30, color: "#5eead4", textTransform: "uppercase", letterSpacing: 2 }}>{eyebrow}</div>
        <div style={{ fontSize: title.length > 40 ? 64 : 80, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
        {detail && <div style={{ fontSize: 32, color: "#d6d3d1" }}>{detail}</div>}
      </div>
    </div>,
    ogSize,
  );
}
