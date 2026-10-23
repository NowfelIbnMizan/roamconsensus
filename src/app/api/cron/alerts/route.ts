import { runAlerts } from "@/lib/alerts";

/** Run daily by Vercel Cron (vercel.json), which sends `Authorization: Bearer <CRON_SECRET>`. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "Not allowed" }, { status: 401 });
  const result = await runAlerts();
  console.log(`[alerts] ${JSON.stringify(result)}`);
  return Response.json(result);
}
