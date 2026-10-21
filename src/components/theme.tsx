"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Choice = "system" | "light" | "dark";
const KEY = "roamconsensus-theme";

/** Runs in <head> before paint so the page never flashes the wrong theme. Kept in sync with apply() below. */
export const themeScript = `(function(){try{var c=localStorage.getItem("${KEY}")||"system";var d=c==="dark"||(c==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.dataset.themeChoice=c}catch(e){}})()`;

const media = () => matchMedia("(prefers-color-scheme: dark)");

function apply(choice: Choice) {
  const dark = choice === "dark" || (choice === "system" && media().matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.themeChoice = choice;
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onSystem = () => {
    if (read() === "system") apply("system");
  };
  media().addEventListener("change", onSystem);
  return () => {
    listeners.delete(cb);
    media().removeEventListener("change", onSystem);
  };
}
const read = (): Choice => (document.documentElement.dataset.themeChoice as Choice) || "system";

const next: Record<Choice, Choice> = { system: "light", light: "dark", dark: "system" };
const icon = { system: Monitor, light: Sun, dark: Moon };
const label = { system: "Theme: match device", light: "Theme: light", dark: "Theme: dark" };

export function ThemeToggle() {
  const choice = useSyncExternalStore(subscribe, read, () => "system" as Choice);
  const Icon = icon[choice];
  return (
    <button
      type="button"
      onClick={() => {
        const c = next[choice];
        try {
          localStorage.setItem(KEY, c);
        } catch {}
        apply(c);
        listeners.forEach((l) => l());
      }}
      aria-label={`${label[choice]}. Change theme`}
      title={label[choice]}
      className="flex size-8 items-center justify-center rounded-full hover:bg-line hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
