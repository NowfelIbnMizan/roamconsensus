"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Plus, Receipt, Trash2, X } from "lucide-react";
import { useCurrencyCode, useMoney, useRates } from "@/components/money";
import { CURRENCIES } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { GroupView } from "@/lib/groups";
import { balances, equalShares, settleUp, spentUsd } from "@/lib/split";

export type CostDraft = { title: string; amountCents: number; currency: string; itemId: string | null };

const button = "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent";
const input = "rounded-lg border border-line bg-background px-3 py-2 text-sm";

/**
 * Who paid what on a group trip: log costs in any currency, see who owes whom in your own currency, and settle up in
 * the fewest payments. No money moves through the site; "Mark paid" just records a payback.
 */
export function SplitCosts({
  group,
  me,
  draft,
  onDraftUsed,
  reload,
}: {
  group: GroupView;
  me: string;
  draft: CostDraft | null;
  onDraftUsed: () => void;
  reload: () => Promise<void>;
}) {
  const { money } = useMoney();
  const rates = useRates();
  const [adding, setAdding] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // "+ Cost" on a stop opens the form with that stop's name and price.
  useEffect(() => {
    if (!draft) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a stop's button hands the draft over from outside
    setAdding(true);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [draft]);

  const name = (id: string) =>
    id === me ? "You" : (group.people.find((p) => p.id === id)?.name.split(" ")[0] ?? "Former member");
  // Guests never sign in, so anyone in the trip can record a payback that involves one.
  const isGuest = (id: string) => group.people.some((p) => p.id === id && p.guest);
  const bal = balances(group.expenses, rates);
  const transfers = settleUp(bal);
  const spent = spentUsd(group.expenses, rates);
  const mine = bal.get(me) ?? 0;

  async function send(path: string, init: RequestInit) {
    setError(null);
    const res = await fetch(`/api/groups/${group.id}${path}`, {
      ...init,
      headers: { "content-type": "application/json" },
    }).catch(() => null);
    if (!res?.ok) {
      setError((await res?.json().catch(() => null))?.error ?? "Couldn't save. Try again.");
      return false;
    }
    await reload();
    return true;
  }

  const markPaid = (from: string, to: string, cents: number) =>
    send("/expenses", {
      method: "POST",
      body: JSON.stringify({
        title: "Paid back",
        amountCents: cents,
        currency: "USD",
        paidById: from,
        isSettlement: true,
        shares: [{ userId: to, amountCents: cents }],
      }),
    });

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}" for everyone?`)) return;
    await send(`/expenses?${new URLSearchParams({ expenseId: id })}`, { method: "DELETE" });
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Receipt className="size-5 text-accent" aria-hidden /> Split costs
        </h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className={`${button} bg-foreground text-background`}>
            <Plus className="size-4" aria-hidden /> Add a cost
          </button>
        )}
      </div>

      {/* Budget vs spent */}
      <div className="mt-4">
        {group.budgetCents ? (
          <>
            <p className="flex flex-wrap justify-between gap-2 text-sm">
              <span>
                <b>{money(spent)}</b> spent of {money(group.budgetCents)}
              </span>
              <button type="button" onClick={() => setBudgetOpen((o) => !o)} className="text-muted underline">
                Change budget
              </button>
            </p>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className={`h-full rounded-full ${spent > group.budgetCents ? "bg-red-500" : "bg-accent"}`}
                style={{ width: `${Math.min(100, (spent / group.budgetCents) * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="flex flex-wrap justify-between gap-2 text-sm">
            <span>
              <b>{money(spent)}</b> spent so far
            </span>
            <button type="button" onClick={() => setBudgetOpen((o) => !o)} className="text-muted underline">
              Set a budget
            </button>
          </p>
        )}
        {budgetOpen && (
          <BudgetForm
            current={group.budgetCents}
            onSave={async (budgetCents) => {
              if (await send("", { method: "PATCH", body: JSON.stringify({ budgetCents }) })) setBudgetOpen(false);
            }}
          />
        )}
      </div>

      {adding && (
        <div ref={formRef}>
          <CostForm
            key={draft ? `${draft.itemId}-${draft.title}` : "new"}
            group={group}
            me={me}
            draft={draft}
            onCancel={() => {
              setAdding(false);
              onDraftUsed();
            }}
            onSave={async (body) => {
              if (await send("/expenses", { method: "POST", body: JSON.stringify(body) })) {
                setAdding(false);
                onDraftUsed();
              }
            }}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {group.expenses.length > 0 && (
        <>
          {/* Where you stand, then the fewest payments that clear it all */}
          <p className="mt-5 text-lg font-semibold">
            {Math.abs(mine) < 50 ? "You're all square" : mine > 0 ? `You're owed ${money(mine)}` : `You owe ${money(-mine)}`}
          </p>
          {transfers.length > 0 ? (
            <ul className="mt-2 grid gap-2">
              {transfers.map((t) => (
                <li
                  key={`${t.from}-${t.to}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line px-3 py-2 text-sm"
                >
                  <span className="font-medium">{name(t.from)}</span>
                  <ArrowRight className="size-4 text-muted" aria-hidden />
                  <span className="font-medium">{name(t.to)}</span>
                  <span className="tabular-nums">{money(t.cents)}</span>
                  {(t.from === me || t.to === me || isGuest(t.from) || isGuest(t.to)) && (
                    <button
                      type="button"
                      onClick={() => markPaid(t.from, t.to, t.cents)}
                      className="ml-auto inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs hover:border-accent"
                    >
                      <Check className="size-3.5" aria-hidden /> Mark paid
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">Everyone is settled up.</p>
          )}

          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-medium">
              All costs · {group.expenses.length}
            </summary>
            <ul className="mt-2 divide-y divide-line">
              {group.expenses.map((e) => {
                const part = e.shares.find((s) => s.userId === me)?.amountCents ?? 0;
                return (
                  <li key={e.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted">
                        {e.isSettlement
                          ? `${name(e.paidById)} paid ${name(e.shares[0]?.userId ?? "").replace(/^You$/, "you")} back`
                          : `${name(e.paidById)} paid · split ${e.shares.length} ${e.shares.length === 1 ? "way" : "ways"}`}
                        {!e.isSettlement && part > 0 && ` · your part ${formatMoney(part, e.currency)}`}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums">{formatMoney(e.amountCents, e.currency)}</span>
                    {e.canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(e.id, e.title)}
                        aria-label={`Delete ${e.title}`}
                        className="text-muted hover:text-rose-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
        </>
      )}
      <p className="fine-print mt-4">Amounts in other currencies use today&apos;s rate. No money moves through Creatour.</p>
    </section>
  );
}

function BudgetForm({ current, onSave }: { current: number | null; onSave: (cents: number | null) => void }) {
  const { toLocal, fromLocal, code } = useMoney();
  const [value, setValue] = useState(current ? String(Math.round(toLocal(current))) : "");
  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(value);
        onSave(value.trim() && n > 0 ? fromLocal(n) : null);
      }}
    >
      <label className="flex items-center gap-2 text-sm">
        Trip budget ({code})
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
          className={`${input} w-32`}
          placeholder="e.g. 2000"
        />
      </label>
      <button type="submit" className={button}>
        Save
      </button>
    </form>
  );
}

function CostForm({
  group,
  me,
  draft,
  onCancel,
  onSave,
}: {
  group: GroupView;
  me: string;
  draft: CostDraft | null;
  onCancel: () => void;
  onSave: (body: unknown) => void;
}) {
  const viewer = useCurrencyCode() ?? "USD";
  const [title, setTitle] = useState(draft?.title ?? "");
  const [amount, setAmount] = useState(draft ? String(draft.amountCents / 100) : "");
  const [currency, setCurrency] = useState(draft?.currency ?? viewer);
  const [paidBy, setPaidBy] = useState(me);
  const [who, setWho] = useState(group.people.map((p) => p.id));
  const [custom, setCustom] = useState(false);
  const [parts, setParts] = useState<Record<string, string>>({});

  const totalCents = Math.round(Number(amount) * 100) || 0;
  const customCents = who.reduce((s, id) => s + (Math.round(Number(parts[id]) * 100) || 0), 0);
  const left = totalCents - customCents;
  const ok = title.trim() && totalCents > 0 && who.length > 0 && (!custom || left === 0);
  const toggle = (id: string) => setWho((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  const pill = (on: boolean) =>
    `inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${on ? "bg-foreground text-background" : "border border-line"}`;

  return (
    <form
      className="mt-4 grid gap-3 rounded-xl border border-accent/40 bg-accent-soft/30 p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        const shares = custom
          ? who.map((userId) => ({ userId, amountCents: Math.round(Number(parts[userId]) * 100) || 0 }))
          : equalShares(totalCents, who);
        onSave({ title: title.trim(), amountCents: totalCents, currency, paidById: paidBy, itemId: draft?.itemId ?? null, shares });
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">Add a cost</p>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="text-muted">
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <label className="grid gap-1 text-sm">
        What for
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={input} placeholder="e.g. Dinner at Jay Fai" maxLength={120} />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="grid flex-1 basis-32 gap-1 text-sm">
          Amount
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className={input}
            placeholder="0"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={input}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Paid by
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={input}>
            {group.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === me ? "You" : p.guest ? `${p.name} (guest)` : p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="text-sm">
        <p>Split between</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {group.people.map((p) => (
            <button key={p.id} type="button" aria-pressed={who.includes(p.id)} onClick={() => toggle(p.id)} className={pill(who.includes(p.id))}>
              {who.includes(p.id) && <Check className="size-3.5" aria-hidden />}
              {p.id === me ? "You" : p.name.split(" ")[0]}
            </button>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} /> Different amounts each
        </label>
        {custom && (
          <div className="mt-2 grid gap-2">
            {who.map((id) => (
              <label key={id} className="flex items-center justify-between gap-3">
                {id === me ? "You" : group.people.find((p) => p.id === id)?.name}
                <input
                  inputMode="decimal"
                  value={parts[id] ?? ""}
                  onChange={(e) => setParts((p) => ({ ...p, [id]: e.target.value.replace(/[^\d.]/g, "") }))}
                  className={`${input} w-28`}
                  placeholder="0"
                />
              </label>
            ))}
            <p className={`text-xs ${left === 0 ? "text-muted" : "text-red-700 dark:text-red-300"}`}>
              {left === 0 ? "Adds up." : `${formatMoney(Math.abs(left), currency)} ${left > 0 ? "left to split" : "too much"}`}
            </p>
          </div>
        )}
        {!custom && totalCents > 0 && who.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            {formatMoney(Math.floor(totalCents / who.length), currency)} each
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={!ok}
        className="justify-self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-40"
      >
        Save cost
      </button>
    </form>
  );
}
