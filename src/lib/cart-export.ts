import { lineTotal, type CartItem } from "@/lib/cart-store";
import { formatMoney, formatPrice } from "@/lib/format";

/** Where you pay for items with no booking site. */
export const payOnSite: Record<CartItem["category"], string> = {
  EXPERIENCE: "Pay at the entrance",
  FOOD: "Pay at the venue",
  TRANSIT: "Arrange locally",
  STAY: "Book direct",
  GEAR: "Buy before you go",
  ESIM: "Buy online",
};

export function groupByVendor(items: CartItem[]) {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.vendor ?? payOnSite[item.category];
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  // Bookable vendors first, biggest spend first.
  return [...groups]
    .map(([vendor, items]) => ({ vendor, items, totalCents: items.reduce((s, i) => s + lineTotal(i), 0) }))
    .sort(
      (a, b) => Number(a.items[0].vendor === null) - Number(b.items[0].vendor === null) || b.totalCents - a.totalCents,
    );
}

const linkFor = (i: CartItem) => i.bookUrl ?? i.website ?? null;

function describe(i: CartItem) {
  const qty = i.unit
    ? ` (${i.quantity} ${i.unit}${i.quantity > 1 ? "s" : ""})`
    : i.quantity > 1
      ? ` x${i.quantity}`
      : "";
  const price = formatPrice(i);
  return `${i.name}${qty}: ${price}${i.couponCode ? ` (code ${i.couponCode})` : ""}${i.note ? ` [note: ${i.note}]` : ""}`;
}

export function toText(items: CartItem[]) {
  const total = items.reduce((s, i) => s + lineTotal(i), 0);
  const lines = ["Creatour trip checklist", `Estimated total: ${formatMoney(total)}`, ""];
  for (const g of groupByVendor(items)) {
    lines.push(`${g.vendor} (${formatMoney(g.totalCents)})`);
    for (const i of g.items) lines.push(`[ ] ${describe(i)}${linkFor(i) ? ` ${linkFor(i)}` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

/** Markdown checklist; pasting into Notion turns `- [ ]` lines into to-do blocks. */
export function toNotionMarkdown(items: CartItem[]) {
  const total = items.reduce((s, i) => s + lineTotal(i), 0);
  const lines = ["# Trip checklist", `Estimated total: **${formatMoney(total)}**`, ""];
  for (const g of groupByVendor(items)) {
    lines.push(`## ${g.vendor} (${formatMoney(g.totalCents)})`);
    for (const i of g.items) lines.push(`- [ ] ${linkFor(i) ? `[${describe(i)}](${linkFor(i)})` : describe(i)}`);
    lines.push("");
  }
  return lines.join("\n");
}

const icsText = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/[;,]/g, (c) => `\\${c}`)
    .replace(/\r?\n/g, "\\n");
// RFC 5545 caps lines at 75 octets; longer ones continue on lines that start with a space.
const fold = (line: string) => line.match(/.{1,72}/gu)?.join("\r\n ") ?? line;
const icsDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/**
 * The day plan as a calendar file: one all-day event per planned stop, on its trip day counted from `startDate`
 * (YYYY-MM-DD). Stops not planned on a day are left out.
 */
export function toIcs(items: CartItem[], startDate: string, days: number, origin: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const stamp = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Creatour//Trip plan//EN", "CALSCALE:GREGORIAN"];
  for (const i of items) {
    if (!i.day || i.day > days) continue;
    const day = new Date(start + (i.day - 1) * 86_400_000);
    const link = linkFor(i);
    const description = [
      `Day ${i.day} · ${formatPrice(i)}`,
      i.note && `Note: ${i.note}`,
      i.couponCode && `Code: ${i.couponCode}`,
      link,
      `From ${i.itinerary.title}: ${origin}/itineraries/${i.itinerary.slug}`,
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${i.id}-${startDate}@creatour.co`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(day)}`,
      `DTEND;VALUE=DATE:${icsDate(new Date(day.getTime() + 86_400_000))}`,
      `SUMMARY:${icsText(i.name)}`,
      `DESCRIPTION:${icsText(description)}`,
      ...(i.destination ? [`LOCATION:${icsText(`${i.name}, ${i.destination.name}`)}`] : []),
      ...(i.lat != null && i.lng != null ? [`GEO:${i.lat};${i.lng}`] : []),
      ...(link ? [`URL:${link}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
