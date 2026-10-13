// Step 5 styling (AGENTS.md "Components"): the hover fill, full-width primaries on phones, and
// links that leave the site.

import { test, expect, type Page } from "@playwright/test";
import { expectExplained, openGame, options } from "./helpers";

/** Every link that leaves the site: where it goes, how it opens and what it says. */
const offSiteLinks = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .filter((a) => new URL((a as HTMLAnchorElement).href).origin !== location.origin)
      .map((a) => ({
        href: (a as HTMLAnchorElement).href,
        target: a.getAttribute("target"),
        rel: a.getAttribute("rel") ?? "",
        arrow: !!a.querySelector("svg.ext"),
        says: `${a.textContent} ${a.getAttribute("aria-label") ?? ""}`,
      })),
  );

test("links that leave the site open a new tab, with the arrow and a word for screen readers", async ({ page }) => {
  for (const path of ["/", "/about", "/q/promises-vs-timeouts-order"]) {
    await page.goto(path);
    if (path.startsWith("/q/")) {
      // The explanation's own link (from the markdown) appears once answered.
      await page.locator("article button").first().click();
      await expect(page.locator("[data-explanation]")).not.toHaveAttribute("inert");
    }
    const links = await offSiteLinks(page);
    expect(links.length, path).toBeGreaterThan(0);
    for (const l of links) {
      expect(l.target, `${path} ${l.href}`).toBe("_blank");
      expect(l.rel, `${path} ${l.href}`).toContain("noopener");
      expect(l.arrow, `${path} ${l.href}`).toBe(true);
      expect(l.says, `${path} ${l.href}`).toContain("(opens in a new tab)");
    }
    // Links within the site stay in the tab.
    expect(await page.locator('a[href^="/"][target]').count(), path).toBe(0);
  }
});

test("the hover fill grows from where the pointer comes in and drains when it leaves", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "no hover on touch");
  await page.goto("/");
  const start = page.getByRole("link", { name: "Start", exact: true });
  const box = (await start.boundingBox())!;
  const fill = () => start.evaluate((el) => getComputedStyle(el, "::before").scale);

  await page.mouse.move(box.x - 20, box.y + 20);
  await page.mouse.move(box.x + 8, box.y + 20); // in from the left edge
  const from = await start.evaluate((el) => parseFloat(el.style.getPropertyValue("--spread-x")));
  expect(from).toBeLessThan(20);
  await expect.poll(fill).toBe("1");

  await page.mouse.move(box.x + box.width + 40, box.y + 20); // out through the right edge
  await expect.poll(() => start.evaluate((el) => parseFloat(el.style.getPropertyValue("--spread-x")))).toBeGreaterThan(box.width - 20);
  await expect.poll(fill).toBe("0");
});

test("on phones the main button spans its column; Next leaves room for its shadow", async ({ page }, info) => {
  test.skip(info.project.name !== "phone");
  await page.goto("/");
  const cta = (await page.getByRole("link", { name: "Start", exact: true }).boundingBox())!;
  const column = (await page.locator("main section").first().boundingBox())!;
  expect(Math.round(cta.width)).toBe(Math.round(column.width));

  await openGame(page);
  await options(page).first().click();
  await expectExplained(page);
  const next = (await page.getByRole("button", { name: "Next question" }).boundingBox())!;
  const option = (await options(page).first().boundingBox())!;
  expect(Math.round(next.width)).toBe(Math.round(option.width) - 4); // the 4px offset shadow fits beside it
});
