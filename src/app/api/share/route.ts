import { db } from "@/lib/db";
import { decodeTrip, shortCode } from "@/lib/share";

/** Longest trip payload we keep: about 200 stops, the most a shared link carries anyway. */
const MAX_PAYLOAD = 20_000;

/** Turns a trip payload (what /trip?t= carries) into a short code for /t/<code>. Same trip, same code. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { t?: unknown } | null;
  const payload = typeof body?.t === "string" ? body.t : "";
  if (!payload || payload.length > MAX_PAYLOAD || !decodeTrip(payload))
    return Response.json({ error: "Not a trip" }, { status: 400 });

  const code = await shortCode(payload);
  const saved = await db.shareLink.upsert({ where: { code }, create: { code, payload }, update: {} });
  // A different trip with the same code is vanishingly unlikely; the caller falls back to the long link.
  if (saved.payload !== payload) return Response.json({ error: "Code taken" }, { status: 409 });
  return Response.json({ code });
}
