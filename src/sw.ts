/// <reference lib="esnext" />
/// <reference lib="webworker" />
// The service worker (AGENTS.md "Offline and install"): precaches the shell, both pages, the deck bundle and its
// images, so the whole game works offline. Bundled by esbuild at build time and served from
// /serwist/sw.js (src/app/serwist/[path]/route.ts), which injects the precache list.

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // A new deploy takes over at once; the game loads everything up front, so a running page
  // never asks for a chunk the new worker has dropped.
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // For anything not precached (future routes); precached URLs are always served from cache.
  runtimeCaching: defaultCache,
  // The game lives at /q/<slug> (AGENTS.md "Offline and install"). Offline, a question's address the browser hasn't
  // kept opens the game's precached shell, which reads the question from the address.
  fallbacks: {
    entries: [
      {
        url: "/play",
        matcher: ({ request }) => request.destination === "document" && new URL(request.url).pathname.startsWith("/q/"),
      },
    ],
  },
});

serwist.addEventListeners();
