import { describe, it, expect } from "vitest";
import { freshProgress, inDeckOrder, isInDeckOrder, reconcile, shuffled } from "./progress";

const ids = ["a", "b", "c", "d"];

describe("reconcile", () => {
  it("starts fresh from nothing or garbage", () => {
    expect(reconcile(undefined, ids)).toEqual(freshProgress(ids));
    expect(reconcile("nope", ids)).toEqual(freshProgress(ids));
  });

  it("keeps a saved order, results and position", () => {
    const saved = { order: ["c", "a", "b", "d"], results: { c: true, a: false }, cur: 2 };
    expect(reconcile(saved, ids)).toEqual(saved);
  });

  it("drops removed questions, appends new ones, and follows the current question", () => {
    const saved = { order: ["c", "gone", "a"], results: { gone: true, a: false }, cur: 2 };
    expect(reconcile(saved, ids)).toEqual({ order: ["c", "a", "b", "d"], results: { a: false }, cur: 1 });
  });

  it("ignores malformed entries", () => {
    const saved = { order: ["a", 7, "a", "b"], results: { b: "yes", c: true }, cur: 99 };
    expect(reconcile(saved, ids)).toEqual({ order: ["a", "b", "c", "d"], results: { c: true }, cur: 3 });
  });
});

describe("shuffled", () => {
  it("permutes the order and keeps the current question current", () => {
    const p = { order: ["a", "b", "c", "d"], results: { b: true }, cur: 1 };
    let seed = 0.3;
    const next = shuffled(p, () => (seed = (seed * 9301 + 0.49297) % 1));
    expect([...next.order].sort()).toEqual(ids);
    expect(next.order[next.cur]).toBe("b");
    expect(next.results).toBe(p.results);
  });
});

describe("deck order", () => {
  it("tells a shuffled order from the deck's own, and puts it back keeping the current question", () => {
    const fresh = freshProgress(ids);
    expect(isInDeckOrder(fresh, ids)).toBe(true);
    const mixed = { order: ["c", "a", "d", "b"], results: { a: false }, cur: 2 };
    expect(isInDeckOrder(mixed, ids)).toBe(false);
    const back = inDeckOrder(mixed, ids);
    expect(back.order).toEqual(ids);
    expect(back.order[back.cur]).toBe("d");
    expect(back.results).toBe(mixed.results);
    expect(isInDeckOrder(back, ids)).toBe(true);
  });
});
