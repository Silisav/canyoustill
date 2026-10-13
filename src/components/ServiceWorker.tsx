"use client";

import { useEffect } from "react";

// Registers the service worker in production. Deliberately not Serwist's React provider: it
// reloads the page when the connection comes back, which would pull a player out of a question.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/serwist/sw.js", { scope: "/" }).catch(() => {
      // No offline support this visit; the game itself is unaffected.
    });
  }, []);
  return null;
}
