import { z } from "zod";
import { freshCartItems } from "@/lib/cart-refresh";

const Body = z.object({
  items: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })).max(200),
});

/** Current prices and links for the lines of a saved cart; see freshCartItems. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid cart" }, { status: 400 });
  return Response.json(await freshCartItems(parsed.data.items));
}
