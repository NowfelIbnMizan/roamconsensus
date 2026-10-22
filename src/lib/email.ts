import { createHmac } from "node:crypto";

/** Email goes out through Resend once RESEND_API_KEY and EMAIL_FROM are set; until then sign-ups are only stored. */
export function canSendEmail() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function siteUrl() {
  return process.env.URL ?? "https://roamconsensus-3arq.netlify.app";
}

/** Signed so an unsubscribe link only works for the address it was sent to. */
export function unsubscribeToken(email: string) {
  return createHmac("sha256", process.env.ADMIN_PASSWORD ?? "roamconsensus")
    .update(`unsub:${email}`)
    .digest("hex");
}

export function unsubscribeUrl(email: string) {
  return `${siteUrl()}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!canSendEmail()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) console.log(`[email] send failed: ${res ? `HTTP ${res.status}` : "network error"}`);
  return Boolean(res?.ok);
}

const escape = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function tripEmailHtml(tripUrl: string, email: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px">
<h2 style="margin:0 0 12px">Your RoamConsensus trip plan</h2>
<p>Here is the day-by-day plan you built. Open it on any phone or computer, and save it to your trip cart there.</p>
<p><a href="${escape(tripUrl)}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">Open my trip</a></p>
<p style="color:#78716c;font-size:12px">You asked for this at RoamConsensus. <a href="${escape(unsubscribeUrl(email))}" style="color:#78716c">Unsubscribe</a></p>
</div>`;
}
