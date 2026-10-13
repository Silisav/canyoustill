// The page follows a reveal (AGENTS.md "Motion"): after an answer it scrolls just far enough to
// show what the answer revealed, and no further.

import { test, expect, type Page } from "@playwright/test";
import { card, expectExplained, openGame, options, output, settled } from "./helpers";

const inView = (page: Page, el: Awaited<ReturnType<Page["locator"]>>) =>
  el.evaluate((node) => {
    const r = node.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });

test("answering scrolls the game as far as Next, but never the output line under the top bar", async ({ page }) => {
  await openGame(page);
  await options(page).last().click();
  await expectExplained(page);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  await page.waitForTimeout(100);
  const next = card(page).getByRole("button", { name: "Next question" });
  const [outTop, barBottom, scrolled, nextShown] = await Promise.all([
    output(page).evaluate((el) => el.getBoundingClientRect().top),
    page.locator("[data-top-bar]").evaluate((el) => el.getBoundingClientRect().bottom),
    page.evaluate(() => scrollY),
    inView(page, next),
  ]);
  expect(scrolled).toBeGreaterThan(0);
  expect(outTop).toBeGreaterThanOrEqual(barBottom);
  // Either Next is on screen, or the page went as far as it may (output just under the bar).
  if (!nextShown) expect(outTop).toBeLessThanOrEqual(barBottom + 14);
});

test("a card answered before comes back where it is, without scrolling", async ({ page }) => {
  await openGame(page);
  await options(page).first().click();
  await expectExplained(page);
  await page.goto("/"); // a fresh visit, not a reload (the browser restores a reload's scroll itself)
  await page.goto("/play");
  await settled(page);
  await page.waitForTimeout(800); // longer than any reveal
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("on home, the strip scrolls into view when the card's foot is below the fold", async ({ page }) => {
  await page.goto("/");
  const sample = page.getByRole("region", { name: "Try one first" });
  const last = sample.getByRole("group", { name: "Answers" }).getByRole("button").last();
  await last.scrollIntoViewIfNeeded(); // as a player would: the option in view, the foot maybe not
  await last.click();
  const strip = sample.getByRole("button", { name: /See why|Start/ });
  await expect(strip).toBeVisible();
  await page.waitForFunction(() => document.getAnimations().length === 0);
  await expect.poll(() => sample.evaluate((el) => Math.round(el.getBoundingClientRect().bottom) <= innerHeight)).toBe(true);
  await expect.poll(() => inView(page, last)).toBe(true);
});
