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
    .sort((a, b) => Number(a.items[0].vendor === null) - Number(b.items[0].vendor === null) || b.totalCents - a.totalCents);
}

const linkFor = (i: CartItem) => i.bookUrl ?? i.website ?? null;

function describe(i: CartItem) {
  const qty = i.unit ? ` (${i.quantity} ${i.unit}${i.quantity > 1 ? "s" : ""})` : i.quantity > 1 ? ` x${i.quantity}` : "";
  const price = formatPrice(i);
  return `${i.name}${qty}: ${price}${i.couponCode ? ` (code ${i.couponCode})` : ""}`;
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
