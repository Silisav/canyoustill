// The home card (AGENTS.md "The home card"): answering the sample never changes page height; the morph lands
// on the same question with the explanation open; a shared /q/... link unfurls with a code image.

import { test, expect, type Page } from "@playwright/test";
import { brand } from "../src/config/brand";
import { card, expectExplained, options, settled } from "./helpers";

const sample = (page: Page) => page.getByRole("region", { name: "Try one first" });
const sampleOptions = (page: Page) => sample(page).getByRole("group", { name: "Answers" }).getByRole("button");

/** Let the strip finish sliding up. */
const stripSettled = (page: Page) => page.waitForFunction(() => document.getAnimations().length === 0);

/** Page height and where the headline and card sit on the page (not the viewport: tapping scrolls). */
const geometry = (page: Page) =>
  page.evaluate(() => {
    const at = (el: Element) => {
      const r = el.getBoundingClientRect();
      return [r.left + scrollX, r.top + scrollY, r.width, r.height].map(Math.round);
    };
    return {
      page: document.documentElement.scrollHeight,
      headline: at(document.querySelector("h1")!),
      card: at(document.querySelector('[aria-label="Try one first"]')!),
    };
  });

for (const scheme of ["light", "dark"] as const) {
  test(`${scheme}: answering the sample changes nothing outside the card`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    const before = await geometry(page);
    await sampleOptions(page).first().click(); // A, wrong
    await expect(sample(page).getByText("Most people miss this one.")).toBeVisible();
    await stripSettled(page);
    expect(await geometry(page)).toEqual(before);
  });
}

test("See why morphs into the game card for the same question, explanation unfolding", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const w = window as unknown as { sameDocument: boolean; transitions: number };
    w.sameDocument = true; // survives only if there's no page load
    w.transitions = 0;
    const start = document.startViewTransition?.bind(document);
    if (start) {
      document.startViewTransition = ((cb: ViewTransitionUpdateCallback) => {
        w.transitions++;
        return start(cb);
      }) as typeof document.startViewTransition;
    }
  });
  await sampleOptions(page).first().click();
  await sample(page).getByRole("button", { name: "See why" }).click();

  await expect(page).toHaveURL(/\/q\/hoisting-var-vs-let$/);
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  expect(await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { transitions?: number }).transitions)).toBe(1);

  // Same marks as on the home page: A picked and wrong, D right, B and C dimmed.
  const fills = await options(page).evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
  expect(fills).toEqual(["1", "0.4", "0.4", "1"]);
  await expect(options(page).nth(0)).toContainText("(your answer)");
  await expect(options(page).nth(3)).toContainText("(right answer)");
  await expect(card(page).locator("[data-output]")).toContainText("undefined and ReferenceError");
  await expectExplained(page);
  await expect(card(page).getByText("Not quite. It's D.")).toBeVisible();

  // It counted: back home, the card is the next unanswered question and Continue points at it.
  await settled(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Continue at 2" })).toBeVisible();
  await expect(page.getByText("1 of 155 answered")).toBeVisible();
  const upNext = page.getByRole("region", { name: "Up next" });
  await expect(upNext).toContainText("setTimeout"); // question 2
  await expect(page.getByRole("region", { name: "Try one first" })).toHaveCount(0);
});

/** Arrive home as a returning player: answer the sample wrong, follow it into the game, come back. */
async function returning(page: Page) {
  await page.goto("/");
  await sampleOptions(page).first().click();
  await sample(page).getByRole("button", { name: "See why" }).click();
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  await settled(page);
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Up next" })).toBeVisible();
}

const watchTransitions = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { sameDocument: boolean; transitions: number };
    w.sameDocument = true;
    w.transitions = 0;
    const start = document.startViewTransition?.bind(document);
    if (start) {
      document.startViewTransition = ((cb: ViewTransitionUpdateCallback) => {
        w.transitions++;
        return start(cb);
      }) as typeof document.startViewTransition;
    }
  });
const transitioned = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { sameDocument?: boolean; transitions?: number };
    return { sameDocument: w.sameDocument, transitions: w.transitions };
  });

test("Continue at N morphs the up-next card into that question, unanswered", async ({ page }) => {
  await returning(page);
  await watchTransitions(page);
  await page.getByRole("link", { name: "Continue at 2" }).click();
  await expect(page).toHaveURL(/\/q\/var-let-settimeout-loop$/);
  await expect(page.locator("[data-top-bar]")).toContainText("2 / 155");
  expect(await transitioned(page)).toEqual({ sameDocument: true, transitions: 1 });
  await expect(options(page).first()).toBeEnabled(); // not answered yet
  await expect(card(page).locator("[data-explanation]")).toHaveAttribute("inert");
});

test("answering on the up-next card works like the sample", async ({ page }) => {
  await returning(page);
  const upNext = page.getByRole("region", { name: "Up next" });
  await upNext.getByRole("group", { name: "Answers" }).getByRole("button").nth(2).click(); // question 2: C is right
  await expect(upNext.getByText("Nice. The rest get harder.")).toBeVisible();
  await watchTransitions(page);
  await upNext.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("[data-top-bar]")).toContainText("2 / 155");
  expect(await transitioned(page)).toEqual({ sameDocument: true, transitions: 1 });
  await expectExplained(page);
  await expect(card(page).getByText("Nice, that's right.")).toBeVisible();
});

test.describe("before any JS runs", () => {
  // The service worker would serve the chunks from its cache, past the request blocking below.
  test.use({ serviceWorkers: "block" });

  test("a returning player never sees question 2 flash first", async ({ page }) => {
    await returning(page);
    // Scripts only: the stylesheet (also under chunks/) must load, it holds the hiding rule.
    await page.route("**/_next/static/chunks/**", (r) => (r.request().resourceType() === "script" ? r.abort() : r.continue()));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-returning", "");
    await expect(page.locator("[data-home-sample]")).toHaveCSS("visibility", "hidden");
  });
});

test("with everything answered the sample comes back and the CTA says Start over", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const deck = (await (await fetch("/decks/javascript/deck.json")).json()) as { questions: { id: string }[] };
    const ids = deck.questions.map((q) => q.id);
    const progress = { order: ids, results: Object.fromEntries(ids.map((id) => [id, true])), cur: 154 };
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("keyval-store");
      open.onupgradeneeded = () => open.result.createObjectStore("keyval");
      open.onsuccess = () => {
        const tx = open.result.transaction("keyval", "readwrite");
        tx.objectStore("keyval").put(progress, "progress:javascript");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
    localStorage.removeItem("next-up");
  });
  await page.reload();
  await expect(page.getByRole("link", { name: "Start over" })).toBeVisible();
  await expect(page.getByText("155 of 155 answered")).toBeVisible();
  await expect(page.getByRole("region", { name: "Try one first" })).toBeVisible();

  // Start over clears everything and morphs the sample into question 1, fresh.
  await watchTransitions(page);
  await page.getByRole("link", { name: "Start over" }).click();
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  expect(await transitioned(page)).toEqual({ sameDocument: true, transitions: 1 });
  await expect(options(page).first()).toBeEnabled();
  await settled(page);
  await page.getByRole("button", { name: "All questions" }).click();
  await expect(page.getByRole("button", { name: "Question 1, not answered" })).toBeVisible();
});

test("Start on a first visit morphs the sample into question 1", async ({ page }) => {
  await page.goto("/");
  await watchTransitions(page);
  await page.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page).toHaveURL(/\/q\/hoisting-var-vs-let$/);
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  expect(await transitioned(page)).toEqual({ sameDocument: true, transitions: 1 });
  await expect(options(page).first()).toBeEnabled();
});

test("opening a question's link without answering it leaves home at Start, matching its card", async ({ page }) => {
  await page.goto("/q/promises-vs-timeouts-order");
  await expect(page.locator("[data-top-bar]")).toContainText("133 / 155");
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Try one first" })).toContainText("sayHi");
  await page.waitForTimeout(300); // saved progress has been read by now
  await expect(page.getByRole("link", { name: "Start", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Continue/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
});

test("Home from the game flies the card back, landing as the question up next", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start", exact: true }).click();
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  await options(page).nth(3).click(); // D, right
  await card(page).locator("[data-output]").click();
  await expectExplained(page);
  await watchTransitions(page);
  await page.locator("[data-site-header] a").first().click(); // the logo: in the game, it flies the card home
  await expect(page).toHaveURL(/\/$/);
  // The rest of home enters as after any page switch; the card, flying in, isn't faded on top.
  await expect(page.getByRole("heading", { level: 1 }).locator(".reveal-word")).toHaveCount(5);
  expect(await page.locator("main [data-entering]").count()).toBeGreaterThan(0);
  await expect(page.locator("[data-entering]").filter({ has: page.getByRole("region", { name: "Up next" }) })).toHaveCount(0);
  expect(await transitioned(page)).toEqual({ sameDocument: true, transitions: 1 });
  await expect(page.getByRole("region", { name: "Up next" })).toContainText("setTimeout"); // question 2
  await expect(page.getByRole("link", { name: "Continue at 2" })).toBeVisible();
});

test("a right answer offers Start, which morphs into the game the same way", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Start", exact: true })).toBeVisible();
  await page.evaluate(() => {
    const w = window as unknown as { sameDocument: boolean; transitions: number };
    w.sameDocument = true;
    w.transitions = 0;
    const start = document.startViewTransition?.bind(document);
    if (start) {
      document.startViewTransition = ((cb: ViewTransitionUpdateCallback) => {
        w.transitions++;
        return start(cb);
      }) as typeof document.startViewTransition;
    }
  });
  await sampleOptions(page).nth(3).click(); // D, right
  await expect(sample(page).getByText("Nice. The rest get harder.")).toBeVisible();
  await sample(page).getByRole("button", { name: "Start" }).click();

  await expect(page).toHaveURL(/\/q\/hoisting-var-vs-let$/);
  await expect(page.locator("[data-top-bar]")).toContainText("1 / 155");
  expect(await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { transitions?: number }).transitions)).toBe(1);
  await expect(options(page).nth(3)).toContainText("(right answer)");
  await expectExplained(page);
  await expect(card(page).getByText("Nice, that's right.")).toBeVisible();

  await settled(page);
  await page.getByRole("button", { name: "All questions" }).click();
  await expect(page.getByRole("button", { name: "Question 1, right" })).toBeVisible();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("See why switches at once and lands with the explanation open", async ({ page }) => {
    await page.goto("/");
    await sampleOptions(page).first().click();
    await sample(page).getByRole("button", { name: "See why" }).click();
    await expect(page).toHaveURL(/\/q\/hoisting-var-vs-let$/);
    await expectExplained(page, 1000);
  });
});

test("a shared /q/ link unfurls with that question's code image", async ({ page, request }) => {
  await page.goto("/q/hoisting-var-vs-let");
  await expect(page.locator("main h1")).toHaveText("What's the output?");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toMatch(/^https?:\/\/[^/]+\/q\/hoisting-var-vs-let\/opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/q\/hoisting-var-vs-let$/);

  const image = await request.get(new URL(og!).pathname + new URL(og!).search);
  expect(image.headers()["content-type"]).toBe("image/png");
  const png = await image.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});

test("a question's link opens the game on it, and the address follows the game from there", async ({ page }) => {
  await page.goto("/");
  await page.goto("/q/promises-vs-timeouts-order");
  const bar = page.locator("[data-top-bar]");
  await expect(bar).toContainText("/ 155"); // the full game: its bar, the site header and footer
  await expect(page.locator("[data-site-header]")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page).toHaveURL(/\/q\/promises-vs-timeouts-order$/);

  await page.locator("main [role=group] button").first().click();
  await page.locator("[data-output]").click(); // skip the typing
  await expect(page.locator("[data-explanation]")).not.toHaveAttribute("inert");
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page).not.toHaveURL(/promises-vs-timeouts-order/);
  await expect(page).toHaveURL(/\/q\/[\w-]+$/);

  await page.getByRole("button", { name: "All questions" }).click();
  await expect(page.getByRole("button", { name: /^Question 133, (right|wrong)$/ })).toBeVisible(); // the answer counted
  await page.keyboard.press("Escape");

  // Moving through questions replaces the address: Back leaves the game.
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
});

test("About covers the source, licence and privacy, and hides repo links until there's a repo", async ({ page }) => {
  await page.goto("/about");
  for (const heading of ["About", "The questions", "Licence", "Privacy"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByText("Copyright (c) 2019 Lydia Hallie")).toBeVisible();
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0);
  // Lydia Hallie is credited with a link to her profile; the repo is linked by its name.
  await expect(page.locator("main").getByRole("link", { name: /^Lydia Hallie/ })).toHaveAttribute("href", "https://www.linkedin.com/in/lydia-hallie/");
  await expect(page.locator("main").getByRole("link", { name: /^javascript-questions/ })).toHaveAttribute(
    "href",
    "https://github.com/lydiahallie/javascript-questions",
  );
});

test("home, About and a long question fit a 375px phone", async ({ page }, info) => {
  test.skip(info.project.name !== "phone");
  for (const path of ["/", "/about", "/q/intl-number-format", "/q/extending-a-class-constructor"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(375);
  }
});

test("the footer credits the questions and the website", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: /Vasilis Tsirimokos/ })).toHaveAttribute("href", "https://www.linkedin.com/in/vtsirimokos/");
  await expect(footer.getByRole("link", { name: /Lydia Hallie/ })).toHaveAttribute("href", "https://www.linkedin.com/in/lydia-hallie/");
});

test("home, About and question pages share one frame: the chrome doesn't move between them", async ({ page }) => {
  const at = async (path: string) => {
    await page.goto(path);
    return page.evaluate(() => {
      const left = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().left);
      return { logo: left("header a"), toggle: left('header button[aria-label="Switch between light and dark"]'), footer: left("footer") };
    });
  };
  const home = await at("/");
  expect(await at("/about")).toEqual(home);
  expect(await at("/q/hoisting-var-vs-let")).toEqual(home);
});

test("a missing page is the site's own 404, and search engines get every page", async ({ page, request }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Nothing here." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap.match(/<loc>/g)?.length).toBe(157); // home, About and the 155 questions
  expect(sitemap).toContain("/q/hoisting-var-vs-let</loc>");
  expect(await (await request.get("/robots.txt")).text()).toMatch(/Sitemap: .*\/sitemap\.xml/);
});

test("search results tell the questions apart, and the game itself stays out of search", async ({ page }) => {
  const meta = (name: string) => page.locator(`meta[name="${name}"]`).getAttribute("content");
  await page.goto("/q/settimeout-call-order");
  await expect(page).toHaveTitle(`setTimeout call order · JavaScript question 30 · ${brand.name}`);
  expect(await meta("description")).toBe(`JavaScript question 30 of 155: setTimeout call order. What's the output? ${brand.pitch}`);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  await page.goto("/");
  expect(await meta("description")).toMatch(/^155 JavaScript questions that look easy and aren't\. /);

  await page.goto("/play");
  expect(await meta("robots")).toBe("noindex");
});

test("a question page advertises a share image that's really there", async ({ page, request }) => {
  await page.goto("/q/hoisting-var-vs-let");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  const res = await request.get(new URL(og!).pathname + new URL(og!).search);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("on a short page the footer sits at the bottom of the window, and nothing hangs below it", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ["/q/hoisting-var-vs-let", "/about", "/"]) {
    await page.goto(path);
    const { footerBottom, pageHeight, viewport } = await page.evaluate(() => ({
      footerBottom: Math.round(document.querySelector("footer")!.getBoundingClientRect().bottom + scrollY),
      pageHeight: document.documentElement.scrollHeight,
      viewport: innerHeight,
    }));
    expect(pageHeight, path).toBe(footerBottom); // the page ends at the footer
    expect(footerBottom, path).toBeGreaterThanOrEqual(viewport); // and never above the window's bottom
  }
});
