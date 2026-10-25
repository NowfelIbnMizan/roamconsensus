import { ChevronRight, Compass, Map, Navigation, Search, ShoppingBag, Sun, Users } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type Tab = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  badge?: string;
  dot?: boolean;
};

function Bar({ tabs }: { tabs: Tab[] }) {
  return (
    <ul
      className="grid border-t border-line bg-background"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      {tabs.map(({ label, icon: Icon, active, badge, dot }) => (
        <li
          key={label}
          className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-medium text-accent" : "text-muted"}`}
        >
          <Icon className="size-5" />
          {label}
          {badge && (
            <span className="absolute top-1 left-1/2 ml-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-background">
              {badge}
            </span>
          )}
          {dot && <span className="absolute top-1.5 left-1/2 ml-2 size-2 rounded-full bg-accent" />}
        </li>
      ))}
    </ul>
  );
}

/** A phone-sized frame: a faded page, then whatever sits at the bottom. */
function Phone({ title, bottom }: { title: string; bottom: ReactNode }) {
  return (
    <figure className="w-[300px] shrink-0">
      <figcaption className="mb-2 text-sm text-muted">{title}</figcaption>
      <div className="relative flex h-[520px] flex-col overflow-hidden rounded-[2rem] border-4 border-foreground/80 bg-background">
        <div className="flex-1 space-y-3 p-4 opacity-40">
          <div className="h-5 w-24 rounded bg-line" />
          <div className="h-32 rounded-2xl bg-line" />
          <div className="h-4 w-3/4 rounded bg-line" />
          <div className="h-4 w-1/2 rounded bg-line" />
          <div className="h-20 rounded-2xl bg-line" />
        </div>
        {bottom}
      </div>
    </figure>
  );
}

const plan = { label: "Plan", icon: Search };
const explore = { label: "Explore", icon: Compass };
const creators = { label: "Creators", icon: Users };
const trip = { label: "Trip", icon: ShoppingBag, badge: "9" };

/** Lab: three ways to put Trip mode one tap away, each shown while planning and while travelling. */
export default function NavLab() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-semibold">A · Today tab</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          While you are on your trip (start date set, today inside it), the Plan tab turns into Today. Before the trip,
          nothing changes.
        </p>
        <div className="mt-4 flex gap-6 overflow-x-auto pb-2">
          <Phone title="Planning" bottom={<Bar tabs={[plan, explore, creators, trip]} />} />
          <Phone
            title="Travelling (day 2)"
            bottom={<Bar tabs={[{ label: "Today", icon: Sun, dot: true }, explore, creators, trip]} />}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">B · Next-stop bar</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          A slim bar above the tabs. Planning: “Your trip · 9 stops · Start trip mode”. Travelling: the next stop with a
          Go button. Tap the bar for Trip mode. Swipe it away to hide for the day.
        </p>
        <div className="mt-4 flex gap-6 overflow-x-auto pb-2">
          <Phone
            title="Planning"
            bottom={
              <>
                <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl border border-line bg-card p-2.5 shadow-sm">
                  <Map className="size-5 shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">Your Bali trip · 9 stops</span>
                    <span className="text-xs text-muted">Open trip mode</span>
                  </span>
                  <ChevronRight className="size-4 text-muted" />
                </div>
                <Bar tabs={[plan, explore, creators, trip]} />
              </>
            }
          />
          <Phone
            title="Travelling (day 2)"
            bottom={
              <>
                <div className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-accent p-2.5 text-background shadow-sm">
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block text-xs opacity-80">Day 2 · next stop</span>
                    <span className="block truncate font-semibold">Uluwatu Temple</span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-background px-3 py-1.5 text-sm font-medium text-accent">
                    <Navigation className="size-4" /> Go
                  </span>
                </div>
                <Bar tabs={[plan, explore, creators, trip]} />
              </>
            }
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">C · Trip menu</h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Tapping Trip opens a small menu: Trip cart, Trip mode, My trips. One tab, three places, nothing hidden.
        </p>
        <div className="mt-4 flex gap-6 overflow-x-auto pb-2">
          <Phone title="Closed" bottom={<Bar tabs={[plan, explore, creators, trip]} />} />
          <Phone
            title="Trip tapped"
            bottom={
              <>
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-x-0 bottom-0">
                  <div className="relative mx-3 mb-2 overflow-hidden rounded-2xl border border-line bg-card shadow-lg">
                    {[
                      ["Trip cart", "9 stops · edit days and budget", ShoppingBag],
                      ["Trip mode", "Today's plan, step by step", Sun],
                      ["My trips", "Saved trips on your account", Map],
                    ].map(([label, sub, Icon]) => {
                      const I = Icon as ComponentType<{ className?: string }>;
                      return (
                        <div
                          key={label as string}
                          className="flex items-center gap-3 border-b border-line p-3 last:border-0"
                        >
                          <I className="size-5 text-accent" />
                          <span className="text-sm">
                            <span className="block font-medium">{label as string}</span>
                            <span className="text-xs text-muted">{sub as string}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <Bar tabs={[plan, explore, creators, { ...trip, active: true }]} />
                  </div>
                </div>
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}
