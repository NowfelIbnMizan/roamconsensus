"use client";

import { Moon, Sun } from "lucide-react";

type Choice = "light" | "dark";
const KEY = "roamconsensus-theme";
const BAR = { light: "#f7f3ec", dark: "#16120d" };

/**
 * Runs in <head> before paint so the page never flashes the wrong theme. With no saved choice it starts light, the
 * paper look the site is designed around (old saved "system" values too). It also tints the phone's browser bar to match. Kept in sync with apply() below.
 */
export const themeScript = `(function(){try{var c=localStorage.getItem("${KEY}");if(c!=="dark")c="light";document.documentElement.dataset.theme=c;var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=c==="dark"?"${BAR.dark}":"${BAR.light}"}catch(e){}})()`;

function apply(choice: Choice) {
  document.documentElement.dataset.theme = choice;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR[choice]);
}

/** Light/dark switch. The icon is picked by CSS from <html data-theme>, so it is right from the first paint. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={() => {
        const next: Choice = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(KEY, next);
        } catch {}
        apply(next);
      }}
      aria-label="Switch between light and dark mode"
      title="Light or dark mode"
      className="flex size-8 items-center justify-center rounded-full hover:bg-line hover:text-foreground"
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
