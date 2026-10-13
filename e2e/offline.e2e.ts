// Offline and install (AGENTS.md "Offline and install"): airplane-mode play works end to end; the app is installable.
// Lighthouse dropped its PWA category in v12, so installability is checked with Chrome's own
// test (the one Lighthouse used): Page.getInstallabilityErrors.

import { test, expect, type Page } from "@playwright/test";
import { card, expectExplained, jumpTo, options, output, settled } from "./helpers";

test.skip(({ browserName }) => browserName !== "chromium");

/** Load /play and wait until the service worker controls it with everything precached. */
async function primeOffline(page: Page) {
  await page.goto("/play");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready; // resolves once installed (precache done) and active
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener("controllerchange", r, { once: true }));
    }
  });
}

const answerAndSkip = async (page: Page, n = 3) => {
  await options(page).nth(n).click();
  await output(page).click();
  await expectExplained(page);
};

test("airplane mode: the whole game works after one visit", async ({ page, context }) => {
  await primeOffline(page);
  await context.setOffline(true);

  // Prove we're really offline: anything not precached fails.
  expect(await page.evaluate(() => fetch("/not-precached").then(() => "online", () => "offline"))).toBe("offline");

  await page.reload();
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  await answerAndSkip(page);
  await expect(card(page).getByText("Nice, that's right.")).toBeVisible();
  await card(page).getByRole("button", { name: "Next question" }).click();
  await settled(page);
  await expect(page.locator("[data-top-bar]")).toContainText("2 / 155");

  // Diagrams and fonts come from the cache too.
  await jumpTo(page, 13);
  await answerAndSkip(page, 3);
  const img = card(page).locator(".md-prose img");
  await expect(img).toBeVisible();
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
    }),
  ).toEqual(expect.arrayContaining(["gabarito", "plexMono"]));

  // Home and a fresh tab load offline as well.
  await page.locator("[data-site-header] a").first().click(); // the logo: in the game, it flies the card home
  await expect(page.getByRole("heading", { name: "Can you still read code?" }).first()).toBeVisible();
  const tab = await context.newPage();
  await tab.goto("/play");
  await expect(tab.locator("[data-top-bar]")).toContainText("13 / 155"); // progress survived too

  // A question's own address that was never opened: the game shell, opened on that question.
  await tab.goto("/q/promises-vs-timeouts-order");
  await expect(tab.locator("[data-top-bar]")).toContainText("133 / 155");
  await expect(tab).toHaveURL(/\/q\/promises-vs-timeouts-order$/);
});

test("installable by Chrome's own criteria, with a complete manifest", async ({ page }) => {
  await primeOffline(page);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  expect(installabilityErrors).toEqual([]);

  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ start_url: "/", scope: "/", display: "standalone", name: expect.any(String) });
  const purposes = manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`);
  expect(purposes).toEqual(["192x192 any", "512x512 any", "512x512 maskable"]);
  for (const icon of manifest.icons) {
    const res = await page.request.get(icon.src);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    expect(`${body.readUInt32BE(16)}x${body.readUInt32BE(20)}`).toBe(icon.sizes);
  }
});
