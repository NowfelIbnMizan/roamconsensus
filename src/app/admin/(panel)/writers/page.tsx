import Link from "next/link";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/email";
import { createWriterInvite, deleteWriterInvite, removeWriter } from "@/lib/admin/actions";
import { DeleteButton, SaveButton, inputClass } from "../../ui";

export default async function WritersAdmin() {
  const [invites, writers] = await Promise.all([
    db.writerInvite.findMany({ where: { usedAt: null }, orderBy: { createdAt: "desc" } }),
    db.user.findMany({
      where: { writer: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { posts: { where: { published: true } } } } },
    }),
  ]);
  return (
    <>
      <h1 className="font-display text-3xl">Guest writers</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Make a link, send it to someone (WhatsApp, email, DM). They open it, sign in with Google and can write posts at
        /write. Nothing goes live until you approve it in <Link href="/admin/blog" className="underline">Blog</Link>.
        Each link works once.
      </p>

      <form action={createWriterInvite} className="mt-6 flex flex-wrap items-end gap-2 rounded-2xl border border-line bg-card p-4">
        <label className="min-w-0 flex-1 basis-60 text-sm">
          <span className="text-muted">Who is it for? (only you see this)</span>
          <input name="label" required className={`mt-1 ${inputClass}`} placeholder="e.g. Sara from Instagram" />
        </label>
        <SaveButton>Make invite link</SaveButton>
      </form>

      {invites.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold">Links not used yet</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="w-40 shrink-0 font-medium">{i.label}</span>
                <input
                  readOnly
                  aria-label={`Invite link for ${i.label}`}
                  value={`${siteUrl()}/write/join/${i.token}`}
                  className={`min-w-0 flex-1 basis-60 font-mono text-xs ${inputClass}`}
                />
                <DeleteButton action={deleteWriterInvite} id={i.id} what={`the link for ${i.label}`} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-semibold">Writers</h2>
        <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
          {writers.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span>
                <span className="font-medium">{w.name}</span>{" "}
                <span className="text-sm text-muted">
                  · {w._count.posts} live {w._count.posts === 1 ? "post" : "posts"}
                </span>
              </span>
              <DeleteButton
                action={removeWriter}
                id={w.id}
                what={w.name}
                verb="Remove"
                question={`Stop ${w.name} writing? Their live posts stay up.`}
              />
            </li>
          ))}
          {writers.length === 0 && <li className="p-4 text-sm text-muted">No writers yet.</li>}
        </ul>
      </section>
    </>
  );
}
