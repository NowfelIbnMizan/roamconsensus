import { lineTotal, type CartItem } from "@/lib/cart-store";
import { formatMoney, formatPrice } from "@/lib/format";

export function groupByVendor(items: CartItem[]) {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.vendor ?? "No booking needed";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  // Bookable vendors first, biggest spend first.
  return [...groups]
    .map(([vendor, items]) => ({ vendor, items, totalCents: items.reduce((s, i) => s + lineTotal(i), 0) }))
    .sort((a, b) => Number(a.items[0].vendor === null) - Number(b.items[0].vendor === null) || b.totalCents - a.totalCents);
}

function describe(i: CartItem) {
  const qty = i.unit ? ` (${i.quantity} ${i.unit}${i.quantity > 1 ? "s" : ""})` : i.quantity > 1 ? ` x${i.quantity}` : "";
  const price = formatPrice(i);
  return `${i.name}${qty}: ${price}${i.couponCode ? ` (code ${i.couponCode})` : ""}`;
}

export function toText(items: CartItem[]) {
  const total = items.reduce((s, i) => s + lineTotal(i), 0);
  const lines = ["RoamConsensus trip checklist", `Estimated total: ${formatMoney(total)}`, ""];
  for (const g of groupByVendor(items)) {
    lines.push(`${g.vendor} (${formatMoney(g.totalCents)})`);
    for (const i of g.items) lines.push(`[ ] ${describe(i)}${i.bookUrl ? ` ${i.bookUrl}` : ""}`);
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
    for (const i of g.items) lines.push(`- [ ] ${i.bookUrl ? `[${describe(i)}](${i.bookUrl})` : describe(i)}`);
    lines.push("");
  }
  return lines.join("\n");
}
