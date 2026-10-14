// The install offer (AGENTS.md "Offline and install"): a card between two questions, never on a first visit, only after
// ≥5 answers, at most once per visit; Install opens the browser's own dialog, "Not now" hides it for
// good, and either way the game carries on to the next question. The browser's install event is
// simulated: headless Chrome never fires a real one.

import { test, expect, type Page } from "@playwright/test";
import { card, expectExplained, openGame, options, settled } from "./helpers";

test.skip(({ browserName }) => browserName !== "chromium");
test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "keyboard-driven"));

const offer = (page: Page) => card(page).getByRole("heading", { name: "Install the web app" });

/** Fire a fake beforeinstallprompt; its prompt() records that it was called. */
const fireInstallEvent = (page: Page, outcome: "accepted" | "dismissed" = "accepted") =>
  page.evaluate((outcome) => {
    const e = new Event("beforeinstallprompt", { cancelable: true }) as Event & Record<string, unknown>;
    e.prompt = async () => {
      (window as unknown as { prompted: boolean }).prompted = true;
    };
    e.userChoice = Promise.resolve({ outcome });
    dispatchEvent(e);
    return e.defaultPrevented; // our <head> script must suppress the browser's own banner
  }, outcome);

/** Answer the current card and skip to the end of its reveal. */
async function answer(page: Page) {
  await page.keyboard.press("1");
  await page.keyboard.press("Enter");
  await expectExplained(page);
}
const next = async (page: Page) => {
  await page.keyboard.press("Enter");
  await settled(page);
};

/** Visit one: answer five questions; nothing may be offered. */
async function firstVisit(page: Page) {
  await openGame(page);
  expect(await fireInstallEvent(page)).toBe(true);
  for (let i = 0; i < 5; i++) {
    await answer(page);
    await expect(offer(page)).toHaveCount(0);
    await next(page);
  }
}

/**
 * A new tab is a new visit (the visit counter is per browser session). It opens where the last
 * one left off; answer that card if needed, then Next: the offer takes the stage, if it's due.
 */
async function secondVisit(page: Page) {
  const tab = await page.context().newPage();
  await openGame(tab);
  await fireInstallEvent(tab);
  if (!(await options(tab).first().isDisabled())) await answer(tab);
  await next(tab);
  return tab;
}

/** The question on stage, by its number in the bar. */
const position = (page: Page) => page.locator("[data-top-bar]").getByRole("button").first().innerText();

test("not on the first visit; on the second, after five answers, between two questions, once", async ({ page }) => {
  await firstVisit(page);
  const tab = await secondVisit(page);
  await expect(offer(tab)).toBeVisible();
  const before = await position(tab);

  await tab.keyboard.press("Enter"); // carries on, without declining
  await settled(tab);
  await expect(offer(tab)).toHaveCount(0);
  expect(await position(tab)).not.toBe(before); // the next question
  expect(await tab.evaluate(() => localStorage.getItem("install"))).toBeNull();

  await answer(tab);
  await next(tab);
  await expect(offer(tab)).toHaveCount(0); // once per visit
});

test("Install opens the browser's dialog, then the game carries on; Not now hides it for good", async ({ page }) => {
  await firstVisit(page);
  const tab = await secondVisit(page);
  await card(tab).getByRole("button", { name: "Install web app" }).click();
  await expect.poll(() => tab.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true);
  await settled(tab);
  await expect(offer(tab)).toHaveCount(0);
  await expect(options(tab).first()).toBeVisible(); // on to the next question
  expect(await tab.evaluate(() => localStorage.getItem("install"))).toBe("installed");

  await tab.evaluate(() => localStorage.removeItem("install"));
  const third = await secondVisit(tab);
  await card(third).getByRole("button", { name: "Not now" }).click();
  await settled(third);
  await expect(offer(third)).toHaveCount(0);
  expect(await third.evaluate(() => localStorage.getItem("install"))).toBe("declined");
  const fourth = await secondVisit(third);
  await expect(offer(fourth)).toHaveCount(0);
});

test("the footer's Install web app: whenever the browser can install, even after Not now; gone once installed", async ({ page }) => {
  const link = page.locator("footer").getByRole("button", { name: "Install web app" });
  await page.goto("/");
  await expect(link).toHaveCount(0); // the browser hasn't offered anything
  await fireInstallEvent(page);
  await expect(link).toBeVisible();

  await page.evaluate(() => localStorage.setItem("install", "declined")); // said Not now to the card
  await page.reload();
  await fireInstallEvent(page);
  await expect(link).toBeVisible();

  await link.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("install"))).toBe("installed");
  await page.reload();
  await fireInstallEvent(page);
  await expect(link).toHaveCount(0);
});
