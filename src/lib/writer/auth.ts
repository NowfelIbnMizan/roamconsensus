import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** The signed-in guest writer, or null (signed out, or not invited, or removed by the owner). */
export async function currentWriter() {
  const user = await currentUser().catch(() => null);
  if (!user) return null;
  return db.user.findFirst({ where: { id: user.id, writer: true }, select: { id: true, name: true } });
}
