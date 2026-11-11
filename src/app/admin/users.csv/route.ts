import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin/auth";
import { csvCell as cell } from "@/lib/csv";

/** Everyone who signed in with Google, as CSV. Private: admin only. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Log in first.", { status: 401 });
  const rows = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true, createdAt: true, alertsEnabled: true, _count: { select: { trips: true } } },
  });
  const csv = [
    "email,name,joined,saved_trips,alerts",
    ...rows.map((r) =>
      [r.email, r.name, r.createdAt.toISOString(), String(r._count.trips), r.alertsEnabled ? "yes" : "no"]
        .map(cell)
        .join(","),
    ),
  ].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="users.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
