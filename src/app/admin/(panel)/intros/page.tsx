import Link from "next/link";
import { db } from "@/lib/db";
import { canDraft, introPages, pageFacts } from "@/lib/intros";
import { approveIntroAction, draftIntroAction, removeIntroAction } from "@/lib/admin/intro-actions";
import { SaveButton, inputClass } from "../../ui";

/** Short intros for list pages: draft with AI or write, edit, approve. Only approved text shows on the site. */
export default async function IntrosAdmin({ searchParams }: PageProps<"/admin/intros">) {
  const { page, note } = await searchParams;
  const [paths, rows] = await Promise.all([introPages(), db.pageIntro.findMany()]);
  const byPath = new Map(rows.map((r) => [r.path, r]));
  const current = typeof page === "string" && paths.includes(page) ? page : null;
  const row = current ? byPath.get(current) : undefined;
  const facts = current ? await pageFacts(current) : null;
  const status = (p: string) => {
    const r = byPath.get(p);
    if (r?.draft) return { label: "Draft waiting", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" };
    if (r?.text) return { label: "Live", cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" };
    return null;
  };

  return (
    <>
      <h1 className="font-display text-3xl">Page intros</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Two lines at the top of a list page, built only from that page&apos;s own data. Ask the AI for a draft or write
        your own, edit it, then approve. Nothing shows on the site until you approve it.
      </p>
      {!canDraft() && (
        <p className="mt-3 max-w-2xl rounded-xl border border-line bg-card p-3 text-sm">
          AI drafts are off: add <code>ANTHROPIC_API_KEY</code> in Vercel (Settings &gt; Environment Variables), then
          redeploy. Each draft costs about one cent. You can still write intros yourself.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto rounded-2xl border border-line bg-card text-sm">
          {paths.map((p) => {
            const s = status(p);
            return (
              <li key={p}>
                <Link
                  href={`/admin/intros?page=${encodeURIComponent(p)}#intro`}
                  className={`flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-line/40 ${p === current ? "bg-line/50 font-medium" : ""}`}
                >
                  <span className="truncate">{p}</span>
                  {s && <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <section id="intro" className="rounded-2xl border border-line bg-card p-4">
          {!current || !facts ? (
            <p className="text-sm text-muted">Pick a page on the left.</p>
          ) : (
            <>
              <h2 className="font-semibold">
                <a href={current} target="_blank" rel="noopener" className="underline">
                  {current}
                </a>
              </h2>
              {typeof note === "string" && <p className="mt-2 rounded-lg bg-accent/10 p-2 text-sm">{note}</p>}
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted">Facts the AI gets (all it may use)</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-xs">{facts}</pre>
              </details>
              {row?.text && (
                <div className="mt-4">
                  <p className="eyebrow">Live now</p>
                  <p className="mt-1 text-sm">{row.text}</p>
                </div>
              )}
              <form action={approveIntroAction} className="mt-4">
                <input type="hidden" name="path" value={current} />
                <label htmlFor="intro-text" className="block text-sm text-muted">
                  {row?.draft ? "Draft: check every fact, edit, then approve" : "Intro"}
                </label>
                <textarea
                  id="intro-text"
                  key={row?.updatedAt.toISOString() ?? "new"}
                  name="text"
                  rows={4}
                  maxLength={600}
                  defaultValue={row?.draft ?? row?.text ?? ""}
                  className={`mt-1 block ${inputClass}`}
                  placeholder="Two short sentences from this page's facts."
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <SaveButton>Approve and publish</SaveButton>
                </div>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {canDraft() && (
                  <form action={draftIntroAction}>
                    <input type="hidden" name="path" value={current} />
                    <SaveButton>{row?.draft || row?.text ? "New AI draft" : "Draft with AI"}</SaveButton>
                  </form>
                )}
                {row?.text && (
                  <form action={removeIntroAction}>
                    <input type="hidden" name="path" value={current} />
                    <button type="submit" className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-accent">
                      Take off the page
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
