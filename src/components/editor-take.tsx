import Link from "next/link";
import { Minus, PenLine, Plus, Quote } from "lucide-react";
import type { Editor } from "@/lib/editor";
import { paragraphs } from "@/lib/editor";

export function EditorAvatar({ editor, size = "size-10" }: { editor: Editor; size?: string }) {
  return editor.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- any host the owner pastes; no next/image allowlist
    <img src={editor.photoUrl} alt={editor.name} className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span
      aria-hidden
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-background`}
    >
      {editor.name.charAt(0)}
    </span>
  );
}

/**
 * The site owner's own commentary on an itinerary, set apart as an editorial review: original words, clearly his,
 * and clearly not the creator's.
 */
export function EditorTake({
  editor,
  take,
  pros = [],
  cons = [],
  creator,
}: {
  editor: Editor;
  take: string | null;
  pros?: string[];
  cons?: string[];
  creator: string;
}) {
  const first = editor.name.split(" ")[0];
  return (
    <aside
      aria-label={`${first}'s take`}
      className="mt-6 max-w-2xl overflow-hidden rounded-2xl border border-line border-l-4 border-l-accent bg-card shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-accent/5 px-4 py-2.5 sm:px-5">
        <p className="eyebrow flex items-center gap-1.5 text-accent">
          <PenLine className="size-3.5" aria-hidden /> Editorial review
        </p>
        <span className="rounded-full border border-line bg-background px-2 py-0.5 text-xs text-muted">
          Independent opinion
        </span>
      </div>
      <div className="px-4 pt-4 pb-4 sm:px-5">
        <p className="font-display text-xl font-semibold">{first}&apos;s take</p>
        {take && (
          <div className="relative mt-2 space-y-3 pl-7 font-display text-[17px] leading-relaxed">
            <Quote className="absolute top-0.5 left-0 size-5 -scale-x-100 text-accent/60" aria-hidden />
            {paragraphs(take).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {(pros.length > 0 || cons.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProsCons title="Pros" items={pros} good />
            <ProsCons title="Cons" items={cons} />
          </div>
        )}
        <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
          <EditorAvatar editor={editor} size="size-9" />
          <p className="min-w-0 text-sm">
            <span className="font-medium">{editor.name}</span>
            <span className="text-muted">, Creatour · </span>
            <Link href="/about" className="text-muted underline hover:text-foreground">
              About {first}
            </Link>
          </p>
        </div>
        <p className="fine-print mt-2">
          {first}&apos;s own opinion, written for Creatour. Not written, checked or endorsed by {creator}; the route and
          its stops are theirs.
        </p>
      </div>
    </aside>
  );
}

function ProsCons({ title, items, good = false }: { title: string; items: string[]; good?: boolean }) {
  if (!items.length) return null;
  const Icon = good ? Plus : Minus;
  return (
    <div className={`rounded-xl p-3 ${good ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-rose-50 dark:bg-rose-950/40"}`}>
      <p className={`eyebrow ${good ? "text-emerald-800 dark:text-emerald-300" : "text-rose-800 dark:text-rose-300"}`}>
        {title}
      </p>
      <ul className="mt-1.5 space-y-1.5 text-sm">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <Icon
              className={`mt-0.5 size-4 shrink-0 ${good ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
              aria-hidden
            />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
