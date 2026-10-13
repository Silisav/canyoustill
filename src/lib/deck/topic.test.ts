import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OVERRIDES, topic } from "./topic";

describe("topic", () => {
  it("turns a slug into words, sentence case for titles", () => {
    expect(topic("hoisting-var-vs-let")).toEqual({ title: "Hoisting var vs let", inSentence: "hoisting var vs let" });
  });
  it("writes JavaScript names as JavaScript does, even at the start", () => {
    expect(topic("settimeout-call-order").title).toBe("setTimeout call order");
    expect(topic("number-isnan-vs-isnan").title).toBe("Number.isNaN vs isNaN");
    expect(topic("for-in-vs-for-of").title).toBe("for...in vs for...of");
    expect(topic("intl-number-format").title).toBe("Intl.NumberFormat");
  });
  it("leaves words that are also object properties alone", () => {
    expect(topic("constructor-without-new").title).toBe("Constructor without new");
  });
  it("uses the hand-written overrides, and each one is for a question that exists", () => {
    expect(topic("not-typeof-precedence").title).toBe("!typeof precedence");
    const slugs: string[] = JSON.parse(readFileSync("content/javascript/deck.json", "utf8")).order;
    for (const slug of Object.keys(OVERRIDES)) expect(slugs, slug).toContain(slug);
  });
});
