// Share (AGENTS.md "Share"): in the header on every page, for the page you're on, and at the end
// of each answer, for that question. With a mouse the link is copied; on touch screens the system
// sheet gets it.

import { test, expect, type Page } from "@playwright/test";
import { card, expectExplained, openGame, options } from "./helpers";

const headerShare = (page: Page) => page.locator("[data-site-header]").getByRole("button", { name: "Share this page", exact: true });

/** Answer the card on screen and wait for its explanation, where the credit line is. */
async function answer(page: Page) {
  await options(page).first().click();
  await card(page).locator("[data-output]").click(); // skip the typing
  await expectExplained(page);
}

test("on a touch screen, the share sheet gets the page you're on, and the question you've just answered", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "touch screens share; with a mouse it copies");
  await page.addInitScript(() => {
    (window as unknown as { shared: unknown[] }).shared = [];
    navigator.share = async (data) => void (window as unknown as { shared: unknown[] }).shared.push(data);
    navigator.canShare = () => true;
  });
  const shared = async () => (await page.evaluate(() => (window as unknown as { shared: { url: string; title?: string }[] }).shared)) ?? [];
  await openGame(page);
  await headerShare(page).click();
  expect(new URL((await shared())[0].url).pathname).toBe("/q/hoisting-var-vs-let");

  await answer(page);
  await card(page).getByRole("button", { name: "Share", exact: true }).click();
  const [, fromAnswer] = await shared();
  expect(new URL(fromAnswer.url).pathname).toBe("/q/hoisting-var-vs-let");
  expect(fromAnswer.title).toContain("Question 1");
});

test("with a mouse, the link is copied and the button says so, even where there's a share sheet", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "with a mouse");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    navigator.share = async () => {
      throw new Error("the share sheet shouldn't open with a mouse");
    };
  });
  const clipboard = async () => new URL(await page.evaluate(() => navigator.clipboard.readText())).pathname;
  await page.goto("/q/hoisting-var-vs-let");
  await headerShare(page).click();
  // Nothing beside the header's icon says which link it was, so the note does.
  await expect(page.getByRole("status").filter({ hasText: "Question link copied" })).toBeVisible();
  // The note fades out with its words in place, rather than emptying into a blank box.
  const note = page.locator('[aria-hidden="true"]', { hasText: "Question link copied" });
  await expect.poll(() => note.evaluate((el) => getComputedStyle(el).opacity), { timeout: 4000 }).toBe("0");
  await expect(note).toHaveText("Question link copied");
  expect(await clipboard()).toBe("/q/hoisting-var-vs-let");

  // At the end of the answer, beside the credit: the word itself says it.
  await page.evaluate(() => navigator.clipboard.writeText(""));
  await answer(page);
  const copy = card(page).getByRole("button", { name: "Share", exact: true });
  await copy.click();
  await expect(card(page).getByRole("button", { name: "Link copied", exact: true })).toBeVisible();
  expect(await clipboard()).toBe("/q/hoisting-var-vs-let");
  await expect(copy).toBeVisible({ timeout: 4000 }); // and back
});

test("every site page has it in the header, for the site or the question on screen; the game's bar has none", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "with a mouse, so the copied address can be read");
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  // Home and About share the site; a question page, that question.
  for (const [path, copied, says] of [
    ["/", "/", "Website link copied"],
    ["/about", "/", "Website link copied"],
    ["/q/hoisting-var-vs-let", "/q/hoisting-var-vs-let", "Question link copied"],
  ] as const) {
    await page.goto(path);
    await headerShare(page).click();
    await expect(page.getByRole("status").filter({ hasText: says })).toHaveCount(1);
    expect(new URL(await page.evaluate(() => navigator.clipboard.readText())).pathname, path).toBe(copied);
  }
  await expect(page.locator("[data-top-bar]").getByRole("button", { name: /share|copy/i })).toHaveCount(0);
});

test("the credit at the end of each answer is the question's number, beside a Share big enough to tap", async ({ page }) => {
  await openGame(page);
  await answer(page);
  const credit = page.locator("[data-explanation] p", { hasText: /^Question 1 · Share$/ });
  await expect(credit).toHaveCount(1);
  await expect(credit.getByRole("link")).toHaveCount(0);
  const share = (await card(page).getByRole("button", { name: "Share", exact: true }).boundingBox())!;
  expect(share.height).toBeGreaterThanOrEqual(24); // WCAG 2.2 target size
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

test("on a small phone the copy note shows above the game's bar, not behind it", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 640 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const page = await context.newPage();
  await page.goto("/q/hoisting-var-vs-let");
  await headerShare(page).click();
  const note = page.locator('[aria-hidden="true"]', { hasText: "Question link copied" });
  await expect(note).toHaveCSS("opacity", "1");
  const box = (await note.boundingBox())!;
  // The note ignores the pointer, so hit-testing would look straight through it: let it be hit, just for this.
  await note.evaluate((el) => ((el as HTMLElement).style.pointerEvents = "auto"));
  const onTop = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent, [box.x + box.width / 2, box.y + box.height / 2]);
  expect(onTop).toBe("Question link copied");
  await context.close();
});
