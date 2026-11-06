import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { visitorStats, visitorStatsReady, type VisitorStats } from "@/lib/goatcounter";
import { FUNNEL } from "@/lib/track";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata = { title: "Visitors and users" };

const num = (n: number) => n.toLocaleString("en-US");
const day = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/** Who visits (GoatCounter) and who signed up (our own database), on one page. */
export default async function StatsPage() {
  await requireAdmin();
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading numbers…</p>}>
      <Stats />
    </Suspense>
  );
}

async function Stats() {
  await connection(); // Live numbers on every visit, never a build-time copy.
  const weekAgo = daysAgo(7);
  const [users, newUsers, trips, groups, hearts, subscribers] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        alertsEnabled: true,
        _count: { select: { trips: true, favourites: true } },
      },
    }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.savedTrip.count(),
    db.groupTrip.count(),
    db.favouritePlace.count(),
    db.subscriber.count({ where: { unsubscribedAt: null } }),
  ]);

  let visits: VisitorStats | null = null;
  let visitsError = false;
  if (visitorStatsReady()) {
    try {
      visits = await visitorStats();
    } catch (e) {
      console.error("[stats]", e);
      visitsError = true;
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl">Visitors and users</h1>
      <p className="mt-1 text-sm text-muted">Visits come from GoatCounter. Sign-ups come from the site&apos;s own database.</p>

      <h2 className="mt-8 font-display text-2xl">Visitors</h2>
      {visits ? (
        <Visitors v={visits} />
      ) : visitsError ? (
        <p className="mt-3 rounded-2xl border border-line bg-card p-4 text-sm">
          GoatCounter didn&apos;t answer. Check that GOATCOUNTER_API_TOKEN in Vercel is right, then reload this page.
        </p>
      ) : (
        <Setup />
      )}

      <h2 className="mt-10 font-display text-2xl">Sign-ups</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Google accounts" value={users.length} />
        <Tile label="New this week" value={newUsers} />
        <Tile label="Saved trips" value={trips} />
        <Tile label="Group trips" value={groups} />
        <Tile label="Hearted places" value={hearts} />
        <Tile label="Email sign-ups" value={subscribers} href="/admin/subscribers" />
      </ul>

      <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl">Google accounts</h3>
        <a href="/admin/users.csv" className="text-sm text-accent underline">
          Download CSV
        </a>
      </div>
      <p className="fine-print mt-1">Private. Use these emails only for what people signed up for.</p>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card text-sm">
        {users.length === 0 && <li className="p-4 text-muted">No one has signed in with Google yet.</li>}
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-3">
            <span className="min-w-0">
              <span className="block break-all font-medium">{u.email}</span>
              <span className="text-xs text-muted">{u.name}</span>
            </span>
            <span className="text-xs text-muted tabular-nums">
              {u._count.trips} trips · {u._count.favourites} hearts{u.alertsEnabled ? " · alerts on" : ""} · joined{" "}
              {day(u.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Tile({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <span className="block text-2xl font-semibold tabular-nums">{num(value)}</span>
      <span className="text-xs text-muted">{label}</span>
    </>
  );
  return (
    <li className="rounded-xl border border-line bg-card p-3">
      {href ? (
        <a href={href} className="block hover:underline">
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
}

function Visitors({ v }: { v: VisitorStats }) {
  const max = Math.max(1, ...v.days.map((d) => d.count));
  return (
    <>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        <Tile label="Today" value={v.today} />
        <Tile label="Last 7 days" value={v.week} />
        <Tile label="Last 30 days" value={v.month} />
      </ul>
      <figure className="mt-3 rounded-2xl border border-line bg-card p-4">
        <figcaption className="text-xs text-muted">Visitors per day, last 30 days</figcaption>
        <div className="mt-3 flex h-28 items-end gap-0.5" role="img" aria-label="Visitors per day chart">
          {v.days.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${num(d.count)}`}
              className="min-h-px flex-1 rounded-t-sm bg-accent"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{v.days[0]?.day}</span>
          <span>{v.days.at(-1)?.day}</span>
        </div>
      </figure>
      <Funnel v={v} />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <TopList title="Top pages" rows={v.pages} />
        <TopList title="Where they came from" rows={v.referrers} />
        <TopList title="Countries" rows={v.countries} />
        <TopList title="Screen sizes" rows={v.devices} />
      </div>
      <p className="fine-print mt-2">
        Admin pages aren&apos;t counted. More detail on your GoatCounter dashboard.
      </p>
    </>
  );
}

/** How many visitors got from browsing to a usable plan, step by step, last 30 days. */
function Funnel({ v }: { v: VisitorStats }) {
  const max = Math.max(1, v.month);
  return (
    <section className="mt-3 rounded-2xl border border-line bg-card p-4">
      <h3 className="text-sm font-medium">Planning funnel, last 30 days</h3>
      <p className="mt-0.5 text-xs text-muted">
        Counts of each step, out of {num(v.month)} visitors. Started counting 6 Nov 2026.
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {FUNNEL.map((f) => {
          const n = v.events[f.event] ?? 0;
          return (
            <li key={f.event}>
              <span className="flex justify-between gap-3">
                <span>{f.label}</span>
                <span className="tabular-nums text-muted">{num(n)}</span>
              </span>
              <span className="mt-1 block h-1.5 rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, (n / max) * 100)}%` }}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TopList({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing yet.</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm">
          {rows.map((r) => (
            <li key={r.name} className="relative flex justify-between gap-3 overflow-hidden rounded px-2 py-0.5">
              <span
                className="absolute inset-y-0 left-0 rounded bg-accent-soft"
                style={{ width: `${(r.count / max) * 100}%` }}
                aria-hidden
              />
              <span className="relative min-w-0 truncate">{r.name}</span>
              <span className="relative tabular-nums text-muted">{num(r.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Setup() {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-card p-4 text-sm">
      <p className="font-medium">Show visitor numbers here (free, one-time setup):</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>Log in to your GoatCounter dashboard.</li>
        <li>Click your username in the top menu &gt; API.</li>
        <li>Make a new key named &quot;Creatour admin&quot;. Tick only the permission for reading statistics. Save and copy the key.</li>
        <li>
          In Vercel: project creatour &gt; Settings &gt; Environment Variables &gt; add GOATCOUNTER_API_TOKEN with
          the token, Production only.
        </li>
        <li>Deployments &gt; latest &gt; Redeploy. Then reload this page.</li>
      </ol>
      {!process.env.GOATCOUNTER_CODE && (
        <p className="mt-2 text-muted">GOATCOUNTER_CODE is also missing, so no visits are being counted yet.</p>
      )}
    </div>
  );
}
