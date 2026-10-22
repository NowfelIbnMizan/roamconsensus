import { db } from "@/lib/db";
import { canSendEmail } from "@/lib/email";

export default async function SubscribersAdmin() {
  const subscribers = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const active = subscribers.filter((s) => !s.unsubscribedAt);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Email sign-ups</h1>
        <a href="/admin/subscribers.csv" className="text-sm text-accent underline">
          Download CSV
        </a>
      </div>
      <p className="mt-1 text-sm text-muted">
        {active.length} subscribed
        {subscribers.length > active.length && `, ${subscribers.length - active.length} unsubscribed`}.{" "}
        {canSendEmail()
          ? "Trip emails are on."
          : 'Trip emails are off: add RESEND_API_KEY and EMAIL_FROM in Netlify to switch on "Email me this trip" in the cart.'}
      </p>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card text-sm">
        {subscribers.length === 0 && <li className="p-4 text-muted">No sign-ups yet.</li>}
        {subscribers.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className={s.unsubscribedAt ? "text-muted line-through" : ""}>{s.email}</span>
            <span className="text-xs text-muted">
              {s.source === "trip" ? "Asked for a trip" : "Footer"} · {s.createdAt.toISOString().slice(0, 10)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
