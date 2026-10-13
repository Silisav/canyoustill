"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The site's paper (AGENTS.md "Background"): the texture behind home and About, fetched and
 * started once the page is idle. It lives in the site layout, so it stays put (and keeps drawing)
 * across page switches; the game (/play, /q/…) has none.
 */
export function SiteBackground() {
  const path = usePathname();
  const game = path === "/play" || path.startsWith("/q/");
  useEffect(() => {
    if (game) return;
    let stop: (() => void) | undefined;
    let live = true;
    const load = () =>
      import("./paper").then(({ startPaper }) => {
        if (live) stop = startPaper();
      });
    const idle = typeof requestIdleCallback === "function";
    const id = idle ? requestIdleCallback(load, { timeout: 2500 }) : window.setTimeout(load, 1200);
    return () => {
      live = false;
      if (idle) cancelIdleCallback(id);
      else clearTimeout(id);
      stop?.();
    };
  }, [game]);
  return null;
}
