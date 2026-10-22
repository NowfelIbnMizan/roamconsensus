import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin/auth";

/** Active sign-ups as CSV, for importing into an email tool. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Log in first.", { status: 401 });
  const rows = await db.subscriber.findMany({ where: { unsubscribedAt: null }, orderBy: { createdAt: "asc" } });
  const csv = [
    "email,source,signed_up",
    ...rows.map((r) => `${r.email},${r.source},${r.createdAt.toISOString()}`),
  ].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="subscribers.csv"' },
  });
}
