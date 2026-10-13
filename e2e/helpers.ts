import { expect, type Page } from "@playwright/test";

/** Wait until no card is entering or leaving and nothing is animating. */
export async function settled(page: Page) {
  await page.waitForFunction(
    () => document.querySelectorAll("main > div").length === 1 && document.getAnimations().length === 0,
  );
}

export async function openGame(page: Page) {
  await page.goto("/play");
  await expect(page.locator("main h1")).toBeVisible();
  await settled(page);
}

/** Jump to upstream question `n` through the All questions sheet. */
export async function jumpTo(page: Page, n: number) {
  await page.getByRole("button", { name: "All questions" }).click();
  await page.getByRole("button", { name: new RegExp(`^Question ${n},`) }).click();
  await expect(page.locator("dialog")).not.toHaveAttribute("open");
  await settled(page);
}

/** The card on stage. */
export const card = (page: Page) => page.locator("main > div:not([inert])");

export const options = (page: Page) => card(page).getByRole("group", { name: "Answers" }).getByRole("button");

/** The typed output line; exists once the card is answered. */
export const output = (page: Page) => card(page).locator("[data-output]");

/**
 * The explanation panel. It's in the DOM, collapsed and inert, before the reveal finishes;
 * Playwright counts clipped content as visible, so check `inert`, not visibility.
 */
export const explanation = (page: Page) => card(page).locator("[data-explanation]");

export async function expectExplained(page: Page, timeout?: number) {
  await expect(explanation(page)).not.toHaveAttribute("inert", { timeout });
}

export async function expectNotExplained(page: Page) {
  await expect(explanation(page)).toHaveAttribute("inert");
}
