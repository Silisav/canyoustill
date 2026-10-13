// The game card (AGENTS.md "Game card"): #6, #13, #57, #66, #126 render correctly at 375px without
// sideways page scroll; options read as buttons in both themes; the reveal follows §3 Motion.

import { test, expect } from "@playwright/test";
import { card, expectExplained, expectNotExplained, jumpTo, openGame, options, output, settled } from "./helpers";

const contrast = (a: number[], b: number[]) => {
  const lum = (c: number[]) => {
    const [r, g, bl] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const rgb = (css: string) => css.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number);

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test("the acceptance questions fit a 375px phone", async ({ page }, info) => {
      test.skip(info.project.name !== "phone");
      await openGame(page);

      const pageWidth = () => page.evaluate(() => document.documentElement.scrollWidth);
      const checks: Record<number, () => Promise<void>> = {
        6: async () => expect(options(page)).toHaveCount(5),
        13: async () => {
          await expect(card(page).locator("figure")).toHaveCount(0);
          await expect(card(page).locator("h1")).toHaveCSS("font-size", "30px");
        },
        57: async () => expect(card(page).locator("figcaption")).toHaveText(["counter.js", "index.js"]),
        66: async () => expect(options(page)).toHaveCount(4),
        126: async () => {
          const pre = card(page).locator("pre");
          await expect(pre).toHaveCSS("font-size", "12.5px");
          await expect(pre).toHaveAttribute("tabindex", "0"); // scrolls, so it's reachable by keyboard
          expect(await pre.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
        },
      };

      for (const [n, check] of Object.entries(checks)) {
        await jumpTo(page, Number(n));
        await expect(page.locator("[data-top-bar]")).toContainText(`${n} / 155`);
        await check();
        expect(await pageWidth(), `#${n} widens the page`).toBeLessThanOrEqual(375);
        await page.screenshot({ path: `test-results/shots/${scheme}-${n}.png`, fullPage: true });
      }
    });

    test("options read as buttons", async ({ page }, info) => {
      await openGame(page);
      const first = options(page).first();
      const look = await first.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          cursor: s.cursor,
          border: s.borderTopWidth,
          edge: s.borderTopColor,
          shadow: s.boxShadow,
          fill: s.backgroundColor,
          page: getComputedStyle(document.body).backgroundColor,
        };
      });
      expect(look.tag).toBe("BUTTON");
      // With a mouse, the cartoon hand (the system pointer behind it); on touch screens, the system's.
      expect(look.cursor).toMatch(info.project.name === "desktop" ? /cursors\/hand\.png.*, pointer$/ : /^pointer$/);
      expect(look.border).toBe("2px");
      expect(look.shadow).toMatch(/0px 3px 0px/); // the ledge
      if (scheme === "dark") expect(contrast(rgb(look.edge), rgb(look.page))).toBeGreaterThanOrEqual(3);
      else expect(contrast(rgb(look.fill), rgb(look.page))).toBeGreaterThan(1.05); // white on paper
    });
  });
}

test("the reveal is one sequence: dim → type → pause → unfold → Next", async ({ page }) => {
  await openGame(page);
  const t0 = Date.now();
  // The clock starts at the click itself, in the page, so a slow round trip can't eat the dim.
  await page.evaluate(() => {
    addEventListener("click", () => ((window as unknown as { clickAt: number }).clickAt = performance.now()), { capture: true, once: true });
  });
  await options(page).nth(2).click(); // C, wrong (answer is D)

  // Record when each step lands, from inside the page.
  const marks = await page.evaluate(async () => {
    const start = (window as unknown as { clickAt: number }).clickAt;
    const at: Record<string, number> = {};
    const out = () => document.querySelector("main > div:not([inert]) [data-output]");
    const panel = () => document.querySelector<HTMLElement>("main > div:not([inert]) [data-explanation]") ?? undefined;
    while (performance.now() - start < 4000) {
      const o = out();
      const typed = o?.querySelector(".text-fg")?.textContent ?? "";
      if (!at.output && o) at.output = performance.now() - start;
      if (!at.partial && typed && typed !== "undefined and ReferenceError") at.partial = performance.now() - start;
      if (!at.typed && typed === "undefined and ReferenceError") at.typed = performance.now() - start;
      if (!at.unfold && panel() && panel()!.getBoundingClientRect().height > 1) at.unfold = performance.now() - start;
      if (!at.open && panel() && !panel()!.inert) at.open = performance.now() - start;
      if (at.open && panel()!.getAnimations().length === 0 && getComputedStyle(panel()!).gridTemplateRows !== "0px") break;
      await new Promise((r) => requestAnimationFrame(r));
    }
    return at;
  });

  expect(marks.output, "output waits for the dim").toBeGreaterThan(100);
  expect(marks.partial, "output types out").toBeLessThan(marks.typed);
  expect(marks.typed - marks.output, "~32ms per character").toBeGreaterThan(700);
  expect(marks.typed - marks.output, "never more than 1.1s").toBeLessThan(1300);
  expect(marks.unfold - marks.typed, "a beat to see the output before the explanation").toBeGreaterThan(350);
  expect(Date.now() - t0).toBeLessThan(5000);

  const states = await options(page).evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  expect(states).toEqual(["0.4", "0.4", "1", "1"]); // others dimmed; C wrong and D right stay
  const fills = await options(page).evaluateAll((els) => {
    const probe = (v: string) => {
      const el = document.createElement("i");
      el.style.background = `var(${v})`;
      document.body.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    };
    return { wrong: getComputedStyle(els[2]).backgroundColor, right: getComputedStyle(els[3]).backgroundColor, badbg: probe("--c-badbg"), okbg: probe("--c-okbg") };
  });
  expect(fills.wrong).toBe(fills.badbg);
  expect(fills.right).toBe(fills.okbg);
  await expect(card(page).getByText("Not quite. It's D.")).toBeVisible();
  await expectExplained(page);
});

test("tapping the output skips the typing", async ({ page }) => {
  await openGame(page);
  await options(page).nth(3).click();
  await expectNotExplained(page);
  await output(page).click();
  await expect(output(page)).toContainText("undefined and ReferenceError");
  await expect(card(page).getByText("Nice, that's right.")).toBeVisible();
  await expectExplained(page);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything is instant and the output shows in full", async ({ page }) => {
    await openGame(page);
    await options(page).first().click();
    await expect(output(page)).toContainText("undefined and ReferenceError", { timeout: 100 });
    await expectExplained(page, 100);
  });
});

test("keyboard: number answers, Enter skips ahead then advances", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop");
  await openGame(page);
  await page.keyboard.press("4");
  await expect(options(page).nth(3)).toBeDisabled();
  await page.keyboard.press("Enter"); // skip the typing
  await expect(card(page).getByText("Nice, that's right.")).toBeVisible();
  await expectExplained(page);
  await page.keyboard.press("Enter"); // next
  await expect(page.locator("[data-top-bar]")).toContainText("2 / 155");
  await settled(page);
  await page.keyboard.press("b");
  await expect(options(page).nth(1)).toBeDisabled();
});

test("progress survives a reload; answered cards come back answered, without animation", async ({ page }) => {
  await openGame(page);
  await options(page).nth(3).click();
  await output(page).click();
  await page.reload();
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  await expect(card(page).getByText("Nice, that's right.")).toBeVisible();
  await expectExplained(page);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await card(page).getByRole("button", { name: "Next question" }).click();
  await settled(page);
  await page.reload();
  await expect(page.locator("[data-top-bar]")).toContainText("2 / 155");
});

test("swipe left advances an answered card", async ({ page }, info) => {
  test.skip(info.project.name !== "phone");
  await openGame(page);
  await options(page).nth(3).click();
  await output(page).click();
  await expectExplained(page);
  await page.locator("main").evaluate((main) => {
    const touch = (x: number) => new Touch({ identifier: 1, target: main, clientX: x, clientY: 400 });
    main.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(300)], changedTouches: [touch(300)] }));
    main.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(120)] }));
  });
  await expect(page.locator("[data-top-bar]")).toContainText("2 / 155");
});

test("theme toggle wins over the system and is applied before first paint", async ({ page }) => {
  await openGame(page);
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.getByRole("button", { name: "Switch between light and dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // The browser chrome follows the choice, whatever the system says.
  const chrome = () =>
    page.locator('meta[name="theme-color"]').evaluateAll((ms) => ms.map((m) => m.getAttribute("content")?.toLowerCase()));
  await expect.poll(chrome).toEqual(["#1a1a18", "#1a1a18"]); // both the light and dark tags
  await page.goto("/play", { waitUntil: "commit" });
  await page.waitForSelector("body");
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(before);
});

test("sheet: Esc closes, the order switches both ways keeping the current question, reset clears answers", async ({ page }) => {
  await openGame(page);
  await options(page).first().click();
  await page.getByRole("button", { name: "All questions" }).click();
  const dialog = page.locator("dialog");
  await expect(dialog).toHaveAttribute("open");
  await expect(dialog.locator(".bg-scrim")).toHaveCSS("background-color", /^rgba\(0, 0, 0, 0\.5\d*\)$/); // page dims
  await expect(page.getByRole("button", { name: "Question 1, wrong" })).toHaveAttribute("aria-current", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open");

  await page.getByRole("button", { name: "All questions" }).click();
  const order = () => page.locator("dialog ol button").allTextContents();
  const before = await order();
  const inOrder = page.getByRole("button", { name: "In order" });
  const mixed = page.getByRole("button", { name: "Shuffled" });
  await expect(inOrder).toHaveAttribute("aria-pressed", "true");
  await mixed.click();
  await expect.poll(order).not.toEqual(before);
  await expect(mixed).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Question 1, wrong" })).toHaveAttribute("aria-current", "true");
  // …and back: the shuffle can be undone.
  await inOrder.click();
  await expect.poll(order).toEqual(before);
  await expect(inOrder).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Question 1, wrong" })).toHaveAttribute("aria-current", "true");

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Reset progress" }).click();
  await settled(page);
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  await expect(options(page).first()).toBeEnabled();
});
