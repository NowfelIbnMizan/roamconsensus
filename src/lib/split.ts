import { convertCents, type Rates } from "@/lib/currency";

export type Share = { userId: string; amountCents: number };
export type Expense = { amountCents: number; currency: string; paidById: string; isSettlement: boolean; shares: Share[] };
export type Transfer = { from: string; to: string; cents: number };

/** Splits a total evenly; the leftover cents go to the first people so the parts always add up. */
export function equalShares(totalCents: number, userIds: string[]): Share[] {
  const n = userIds.length;
  if (!n) return [];
  const base = Math.floor(totalCents / n);
  const rest = totalCents - base * n;
  return userIds.map((userId, i) => ({ userId, amountCents: base + (i < rest ? 1 : 0) }));
}

/** What each person is up (+) or down (−) in US cents: what they paid minus their share, across every currency. */
export function balances(expenses: Expense[], rates: Rates): Map<string, number> {
  const usd = (cents: number, from: string) => convertCents(cents, from, "USD", rates).cents;
  const out = new Map<string, number>();
  const add = (id: string, cents: number) => out.set(id, (out.get(id) ?? 0) + cents);
  for (const e of expenses) {
    add(e.paidById, usd(e.amountCents, e.currency));
    for (const s of e.shares) add(s.userId, -usd(s.amountCents, e.currency));
  }
  return out;
}

/** The fewest payments that clear every balance: the biggest debtor pays the biggest creditor, and so on. */
export function settleUp(balance: Map<string, number>, minCents = 50): Transfer[] {
  const owe = [...balance].filter(([, c]) => c < -minCents).map(([id, c]) => ({ id, c: -c }));
  const owed = [...balance].filter(([, c]) => c > minCents).map(([id, c]) => ({ id, c }));
  owe.sort((a, b) => b.c - a.c);
  owed.sort((a, b) => b.c - a.c);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < owe.length && j < owed.length) {
    const cents = Math.min(owe[i].c, owed[j].c);
    if (cents > minCents) out.push({ from: owe[i].id, to: owed[j].id, cents });
    owe[i].c -= cents;
    owed[j].c -= cents;
    if (owe[i].c <= minCents) i++;
    if (owed[j].c <= minCents) j++;
  }
  return out;
}

/** Money actually spent on the trip in US cents: paying each other back doesn't count. */
export function spentUsd(expenses: Expense[], rates: Rates) {
  return expenses
    .filter((e) => !e.isSettlement)
    .reduce((sum, e) => sum + convertCents(e.amountCents, e.currency, "USD", rates).cents, 0);
}
