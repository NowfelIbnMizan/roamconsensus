import { getIntro } from "@/lib/intros";

/** The owner-approved intro for a list page; nothing when there is none. */
export async function PageIntro({ path, className = "" }: { path: string; className?: string }) {
  const text = await getIntro(path);
  return text ? <p className={`max-w-2xl text-pretty ${className}`}>{text}</p> : null;
}
