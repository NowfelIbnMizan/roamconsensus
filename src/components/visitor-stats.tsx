"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    goatcounter?: { count: (vars: { path: string }) => void };
  }
}

/**
 * GoatCounter page views: free, no cookies, so no cookie banner needed. Counts every page change in the app, not only
 * the first load. Admin pages are left out so your own editing doesn't inflate the numbers.
 */
export function VisitorStats({ code }: { code: string }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready && !pathname.startsWith("/admin")) window.goatcounter?.count({ path: pathname });
  }, [ready, pathname]);

  return (
    <Script
      src="https://gc.zgo.at/count.js"
      data-goatcounter={`https://${code}.goatcounter.com/count`}
      data-goatcounter-settings='{"no_onload": true}'
      strategy="afterInteractive"
      onReady={() => setReady(true)}
    />
  );
}
