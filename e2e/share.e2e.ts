// Share (AGENTS.md "Share"): with a mouse the question's link is copied; on touch screens the
// system sheet gets it.

import { test, expect } from "@playwright/test";
import { openGame } from "./helpers";

test("on a touch screen, the share sheet gets the current question's /q/ link", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "touch screens share; with a mouse it copies");
  await page.addInitScript(() => {
    (window as unknown as { shared: unknown[] }).shared = [];
    navigator.share = async (data) => void (window as unknown as { shared: unknown[] }).shared.push(data);
    navigator.canShare = () => true;
  });
  await openGame(page);
  await page.getByRole("button", { name: "Share this question" }).click();
  const shared = (await page.evaluate(() => (window as unknown as { shared: { url: string; title: string }[] }).shared)) ?? [];
  expect(shared).toHaveLength(1);
  expect(new URL(shared[0].url).pathname).toBe("/q/hoisting-var-vs-let");
  expect(shared[0].title).toContain("Question 1");
});

test("with a mouse, the link is copied and the button says so, even where there's a share sheet", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "with a mouse");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    navigator.share = async () => {
      throw new Error("the share sheet shouldn't open with a mouse");
    };
  });
  await page.goto("/q/hoisting-var-vs-let");
  await page.getByRole("button", { name: "Copy link to this question" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
  // The note fades out with its words in place, rather than emptying into a blank box.
  const note = page.locator('[aria-hidden="true"]', { hasText: "Link copied" });
  await expect.poll(() => note.evaluate((el) => getComputedStyle(el).opacity), { timeout: 4000 }).toBe("0");
  await expect(note).toHaveText("Link copied");
  expect(new URL(await page.evaluate(() => navigator.clipboard.readText())).pathname).toBe("/q/hoisting-var-vs-let");
});

test("question pages and the game have it; home and About don't", async ({ page }) => {
  for (const [path, count] of [["/", 0], ["/about", 0], ["/q/hoisting-var-vs-let", 1]] as const) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: /Share this question|Copy link to this question/ }), path).toHaveCount(count);
  }
});

test("the game's top bar fits small phones without sideways scroll", async ({ browser }) => {
  for (const width of [320, 360, 375]) {
    const page = await (await browser.newContext({ viewport: { width, height: 700 } })).newPage();
    await openGame(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px`).toBeLessThanOrEqual(width);
    const bar = await page.locator("[data-top-bar]").evaluate((el) => [...el.children].map((c) => c.getBoundingClientRect().right));
    for (const right of bar) expect(right, `${width}px`).toBeLessThanOrEqual(width);
    await page.close();
  }
});
