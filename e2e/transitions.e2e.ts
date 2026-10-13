// Step 5 motion (AGENTS.md "Motion", "Background"): page switches, the background paper and the
// logo squish.

import { test, expect, type Page } from "@playwright/test";
import { brand } from "../src/config/brand";

/** Note whether a page switch ran its view transition. */
const watchSwitch = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { seen: boolean }).seen = false;
    new MutationObserver(() => {
      if ("pageTransition" in document.documentElement.dataset) (window as unknown as { seen: boolean }).seen = true;
    }).observe(document.documentElement, { attributes: true });
  });

const headerBox = (page: Page) => page.locator("[data-site-header]").boundingBox();

test("a page switch keeps the header still", async ({ page }) => {
  await page.goto("/");
  const before = await headerBox(page);
  await watchSwitch(page);
  await page.locator("footer").getByRole("link", { name: "About and privacy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as unknown as { seen: boolean }).seen)).toBe(true);
  await expect.poll(() => page.evaluate(() => "pageTransition" in document.documentElement.dataset)).toBe(false);
  expect(await headerBox(page)).toEqual(before);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("page switches are instant", async ({ page }) => {
    await page.goto("/about");
    await watchSwitch(page);
    await page.locator("[data-site-header]").getByRole("link", { name: brand.name }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Can you still read code?" })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { seen: boolean }).seen)).toBe(false);
  });
});

test("the paper is on every site page, stays put across a page switch, and the game has none", async ({ page }) => {
  await page.goto("/");
  const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  test.skip(!webgl, "no WebGL2 here: the pages are plain, by design");
  const paper = page.locator("body > canvas");
  await expect(paper).toHaveCount(1, { timeout: 5000 }); // started once the page is idle
  await expect(paper).toHaveAttribute("aria-hidden", "true");
  await paper.evaluate((el) => el.setAttribute("data-same", "")); // mark it: the same canvas after the switch?
  await page.locator("footer").getByRole("link", { name: "About and privacy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  await expect(page.locator("body > canvas[data-same]")).toHaveCount(1);
  await page.goto("/play");
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("body > canvas")).toHaveCount(0);
});

test("on a page switch the headings rise line by line, then go back to plain text", async ({ page }) => {
  await page.goto("/about");
  await page.locator("[data-site-header]").getByRole("link", { name: brand.name }).click();
  const h1 = page.getByRole("heading", { level: 1, name: "Can you still read code?" });
  await expect(h1).toBeVisible();
  await expect(h1.locator(".reveal-word")).toHaveCount(5); // one per word, each with its line's delay
  const delays = await h1.locator(".reveal-word").evaluateAll((els) => els.map((el) => (el as HTMLElement).style.animationDelay));
  expect(new Set(delays).size).toBeGreaterThan(1); // two lines, two delays
  // Everything else on screen waits its turn after the headline: one sequence, in reading order.
  const blocks = await page.locator("main [data-enter]").evaluateAll((els) =>
    els.filter((el) => el.getBoundingClientRect().top < innerHeight).map((el) => [el.hasAttribute("data-entering"), parseFloat((el as HTMLElement).style.animationDelay)]),
  );
  expect(blocks.length).toBeGreaterThan(0);
  for (const [entering, delay] of blocks) {
    expect(entering).toBe(true);
    expect(delay).toBeGreaterThan(parseFloat(delays[0]));
  }
  // Rising text wraps exactly as the plain text will: nothing moves when it's restored.
  const boxes = () =>
    page.locator("main [data-reveal]").evaluateAll((els) =>
      els.slice(0, 2).map((el) => {
        const r = el.getBoundingClientRect();
        return [Math.round(r.top), Math.round(r.height), Math.round(r.width)];
      }),
    );
  const rising = await boxes();
  await expect(h1.locator(".reveal-word")).toHaveCount(0, { timeout: 3000 }); // restored afterwards
  expect(await boxes()).toEqual(rising);
  await expect(h1).toHaveText("Can you still read code?");
  await expect(page.locator("main p[data-reveal]").first()).toHaveText(/^155 JavaScript questions that look easy and aren't\. Use your brain, choose/);
});

test("the logo squishes when pressed, on any page that shows it", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "pressing with a mouse");
  await page.goto("/about");
  const logo = page.getByRole("link", { name: brand.name }).locator("svg");
  const box = (await logo.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(() => logo.evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");
  await page.mouse.up(); // a click: home, with the header (and the spring) carrying over
  await expect(page.getByRole("heading", { level: 1, name: "Can you still read code?" })).toBeVisible();
  await expect.poll(() => logo.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 }).toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/);
});
