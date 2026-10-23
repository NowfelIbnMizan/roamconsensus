import { createHmac } from "node:crypto";
import type { CartData } from "@/lib/cart-data";
import { freshCartItems } from "@/lib/cart-refresh";
import { db } from "@/lib/db";
import { canSendEmail, sendEmail, siteUrl } from "@/lib/email";
import { formatMoney } from "@/lib/format";

/** Signed so the "turn off alerts" link in an email only works for that account. */
export function alertsOffToken(userId: string) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "roamconsensus")
    .update(`alerts-off:${userId}`)
    .digest("hex");
}

const alertsOffUrl = (userId: string) =>
  `${siteUrl()}/api/account/alerts?off=${encodeURIComponent(userId)}&t=${alertsOffToken(userId)}`;

type PriceChange = { name: string; from: number; to: number };
type NewRoute = { title: string; slug: string; city: string; creator: string };

const escape = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function alertHtml(userId: string, changes: PriceChange[], routes: NewRoute[]) {
  const site = siteUrl();
  const priceRows = changes
    .map(
      (c) =>
        `<li>${escape(c.name)}: ${formatMoney(c.from)} → <strong>${formatMoney(c.to)}</strong> ${c.to < c.from ? "(cheaper)" : ""}</li>`,
    )
    .join("");
  const routeRows = routes
    .map(
      (r) =>
        `<li><a href="${site}/itineraries/${r.slug}" style="color:#0f766e">${escape(r.title)}</a> by ${escape(r.creator)} (${escape(r.city)})</li>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:520px">
<h2 style="margin:0 0 12px">News for your Creatour trip</h2>
${changes.length ? `<p>Prices changed for stops in your trip cart:</p><ul>${priceRows}</ul>` : ""}
${routes.length ? `<p>New creator routes for your cities:</p><ul>${routeRows}</ul>` : ""}
<p><a href="${site}/cart" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Open my trip cart</a></p>
<p style="color:#78716c;font-size:12px">You turned on trip alerts at Creatour. <a href="${alertsOffUrl(userId)}" style="color:#78716c">Turn off alerts</a></p>
</div>`;
}

/**
 * Daily check for every traveller with alerts on: prices in their synced cart that changed since the last check, and
 * creator routes added for their cart's cities. The first check only records prices. Returns how many emails went out.
 */
export async function runAlerts(now = new Date()) {
  if (!canSendEmail()) return { checked: 0, sent: 0, skipped: "email not set up" };
  const users = await db.user.findMany({
    where: { alertsEnabled: true, cart: { isNot: null } },
    select: { id: true, email: true, alertsCheckedAt: true, cart: true },
  });
  let sent = 0;
  for (const user of users) {
    const data = user.cart!.data as unknown as CartData;
    const fresh = await freshCartItems(data.items.map((i) => ({ id: i.id, name: i.name, slug: i.itinerary.slug })));
    const before = (user.cart!.alertPrices ?? {}) as Record<string, number | null>;
    const prices = Object.fromEntries(data.items.map((i) => [i.id, fresh[i.id]?.priceCents ?? i.priceCents]));
    const changes = data.items.flatMap((i): PriceChange[] => {
      const from = before[i.id];
      const to = prices[i.id];
      return from != null && to != null && from !== to ? [{ name: i.name, from, to }] : [];
    });

    const cities = [...new Set(data.items.map((i) => i.destination?.slug).filter(Boolean))] as string[];
    const inCart = new Set(data.items.map((i) => i.itinerary.slug));
    const routes: NewRoute[] =
      user.alertsCheckedAt && cities.length
        ? (
            await db.itinerary.findMany({
              where: { createdAt: { gt: user.alertsCheckedAt }, destination: { slug: { in: cities } } },
              select: {
                slug: true,
                title: true,
                destination: { select: { name: true } },
                creator: { select: { name: true } },
              },
            })
          )
            .filter((r) => !inCart.has(r.slug))
            .map((r) => ({ slug: r.slug, title: r.title, city: r.destination.name, creator: r.creator.name }))
        : [];

    if (
      (changes.length || routes.length) &&
      (await sendEmail({
        to: user.email,
        subject: "News for your Creatour trip",
        html: alertHtml(user.id, changes, routes),
      }))
    )
      sent++;
    await db.$transaction([
      db.userCart.update({ where: { userId: user.id }, data: { alertPrices: prices } }),
      db.user.update({ where: { id: user.id }, data: { alertsCheckedAt: now } }),
    ]);
  }
  return { checked: users.length, sent };
}
