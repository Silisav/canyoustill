import { describe, it, expect, beforeAll } from "vitest";
import { buildDeck, codeSize, splitFiles, toPlain } from "./build";
import { highlight } from "./highlight";
import type { Deck, Question } from "./types";

let deck: Deck;
const q = (id: string): Question => {
  const found = deck.questions.find((x) => x.id === id);
  if (!found) throw new Error(`no question ${id}`);
  return found;
};

beforeAll(async () => {
  deck = await buildDeck("javascript");
}, 60_000);

describe("buildDeck (committed content)", () => {
  it("has every question, in deck order, with upstream numbers and source links", () => {
    expect(deck.questions).toHaveLength(155);
    expect(deck.questions[0]).toMatchObject({
      id: "hoisting-var-vs-let",
      number: 1,
      sourceUrl: "https://github.com/lydiahallie/javascript-questions#1-whats-the-output",
      answer: "D",
      output: "undefined and ReferenceError",
    });
    expect(deck.questions.every((x) => x.sourceUrl?.startsWith("https://github.com/"))).toBe(true);
  });

  it("#6 keeps all five options", () => {
    expect(q("object-reference-assignment").options.map((o) => o.key)).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("#13 has no code, and its diagram is local with half-size dimensions", () => {
    const e = q("event-propagation-phases");
    expect(e.code).toEqual([]);
    expect(e.explanationHtml).toContain(
      '<img src="/decks/javascript/images/event-propagation-phases-1.png" alt="" width="248" height="136"',
    );
  });

  it("#57 is two files; #67 splits one block at its file comments", () => {
    expect(q("incrementing-imported-binding").code.map((c) => c.file)).toEqual(["counter.js", "index.js"]);
    const files = q("import-execution-order").code;
    expect(files.map((c) => c.file)).toEqual(["index.js", "sum.js"]);
    expect(files[1].html).not.toContain("// sum.js");
  });

  it("#126 steps the code font down for its long lines", () => {
    expect(q("intl-number-format").code[0].size).toBe("longer"); // 82-char return line
  });

  it("renders option markdown, keeping allowed HTML", () => {
    expect(q("hoisting-var-vs-let").options[0].html).toBe("<code>Lydia</code> and <code>undefined</code>");
    expect(q("string-raw").options[1].html).toContain("<br />");
  });

  it("highlights fenced code in explanations and opens external links in a new tab", () => {
    expect(q("method-on-constructor-function").explanationHtml).toMatch(/<pre><code>[\s\S]*<span class="s-kw">/);
    const html = q("promises-vs-timeouts-order").explanationHtml;
    expect(html).toContain('target="_blank" rel="noopener"');
    // The ↗ stays with the link's last word, and screen readers hear where it goes.
    expect(html).toMatch(/<span class="whitespace-nowrap">[^<\s]+<svg class="ext"[^>]*>.*?<\/svg><\/span><span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/);
  });
});

describe("highlight", () => {
  it("emits token classes, leaving identifiers and operators plain", async () => {
    const html = await highlight("var n = 'a' + 1; // hi\nconsole.log(sayHi(n));\nfunction sayHi() {}", "javascript");
    expect(html).toContain('<span class="s-kw">var</span> n = ');
    expect(html).toContain(`<span class="s-str">'a'</span>`);
    expect(html).toContain('<span class="s-num">1</span>');
    expect(html).toContain('<span class="s-cm">// hi</span>');
    expect(html).toMatch(/<span class="s-fn">log<\/span>/);
    expect(html).toMatch(/<span class="s-fn">sayHi<\/span>/);
    expect(html.split("\n")).toHaveLength(3);
  });

  it("escapes HTML in code", async () => {
    expect(await highlight("a < b && c > d", "text")).toBe("a &lt; b &amp;&amp; c &gt; d");
    expect(await highlight("<div>", "html")).not.toContain("<div>");
  });
});

describe("helpers", () => {
  it("codeSize steps at 44 and 58 characters", () => {
    expect(codeSize("x".repeat(44))).toBe("base");
    expect(codeSize("x".repeat(45))).toBe("long");
    expect(codeSize("x".repeat(59))).toBe("longer");
  });

  it("splitFiles leaves ordinary code alone", () => {
    expect(splitFiles("// not a file\nlet a;")).toEqual([{ file: null, source: "// not a file\nlet a;" }]);
  });

  it("toPlain turns inline HTML back into text", () => {
    expect(toPlain("<code>a &lt; b</code> and <code>&#39;x&#39;</code>")).toBe("a < b and 'x'");
    expect(toPlain("<code>Hello</code> <br /> <code>world</code>")).toBe("Hello \n world");
  });
});
