import Link from "next/link";
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

/** The site owner's own commentary on an itinerary, clearly set apart from the creator's content. */
export function EditorTake({ editor, take }: { editor: Editor; take: string }) {
  return (
    <aside className="mt-5 max-w-2xl rounded-2xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-3">
        <EditorAvatar editor={editor} />
        <div>
          <p className="font-semibold">{editor.name}&apos;s take</p>
          <Link href="/about" className="text-xs text-muted underline hover:text-foreground">
            Who is {editor.name}?
          </Link>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-[15px]">
        {paragraphs(take).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </aside>
  );
}
