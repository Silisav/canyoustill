// AGENTS.md "Budget and performance": ≤50KB gzipped of our own JS on the game route, on top of the Next/React baseline
// (measured on the 404 page, which ships nothing but the framework and the root layout).
// Counts the scripts the page loads itself, not what links prefetch afterwards for other routes.

import { test, expect, type APIRequestContext } from "@playwright/test";
import { gzipSync } from "node:zlib";

const BUDGET = 50_000;

async function routeScripts(request: APIRequestContext, path: string) {
  const html = await (await request.get(path, { failOnStatusCode: false })).text();
  const srcs = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)]
    .filter((m) => !/\bnomodule\b/i.test(m[0])) // legacy polyfills don't load in modern browsers
    .map((m) => m[1]);
  const sizes = await Promise.all(
    [...new Set(srcs)].map(async (src) => [src, gzipSync(await (await request.get(src)).body(), { level: 9 }).length] as const),
  );
  return new Map(sizes);
}

test("the game route stays within its JS budget", async ({ request }, info) => {
  test.skip(info.project.name !== "desktop");
  const baseline = await routeScripts(request, "/this-page-does-not-exist");
  const play = await routeScripts(request, "/play");
  const ours = [...play].filter(([src]) => !baseline.has(src)).reduce((n, [, size]) => n + size, 0);
  const total = [...play.values()].reduce((n, size) => n + size, 0);
  console.log(`/play JS gzipped: ${total} bytes in total; ${ours} of ours (budget ${BUDGET})`);
  expect(ours).toBeLessThanOrEqual(BUDGET);
});
