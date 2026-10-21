"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void> };

/** Registers the offline service worker, and offers "Install app" where the browser allows it. */
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = matchMedia("(display-mode: standalone)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only checks after mount
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    addEventListener("beforeinstallprompt", onPrompt);
    return () => removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return null;
  if (prompt)
    return (
      <button
        type="button"
        onClick={() => prompt.prompt().then(() => setPrompt(null))}
        className="inline-flex items-center gap-1.5 underline hover:text-foreground"
      >
        <Smartphone className="size-3.5" aria-hidden /> Install the app: your trip works offline
      </button>
    );
  if (ios)
    return (
      <span className="inline-flex items-center gap-1.5">
        <Smartphone className="size-3.5" aria-hidden /> Install: tap Share, then &quot;Add to Home Screen&quot;
      </span>
    );
  return null;
}
