// /serwist/sw.js: the service worker, bundled at build time with its precache list.

import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSerwistRoute } from "@serwist/turbopack";
import { deckIds, deckImages, imagesDir } from "@/lib/deck/build";
import { CURSORS } from "@/lib/cursor-image";

// _next/static/** is precached by Serwist with its content-hashed names. Pages and the deck
// bundle change with any build, so they're revisioned per build; images only when their bytes do.
const build = randomUUID();
const fileHash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 16);

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
  // Serwist's default pattern skips fonts; offline play needs Gabarito and Plex Mono too.
  globPatterns: [".next/static/**/*.{js,css,woff2,png,svg,ico,webp,json,webmanifest}"],
  additionalPrecacheEntries: [
    { url: "/", revision: build },
    { url: "/play", revision: build },
    { url: "/about", revision: build },
    { url: "/manifest.webmanifest", revision: build },
    ...Object.keys(CURSORS).map((file) => ({ url: `/cursors/${file}`, revision: build })),
    ...deckIds().flatMap((deck) => [
      { url: `/decks/${deck}/deck.json`, revision: build },
      ...deckImages(deck).map((file) => ({
        url: `/decks/${deck}/images/${file}`,
        revision: fileHash(join(imagesDir(deck), file)),
      })),
    ]),
  ],
});
