import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validateContent } from "./validate.mjs";

const VALID = `---
id: sample-question
title: What's the output?
answer: B
options:
  A: "\`Promise {<pending>}\`"
  B: "\`Hello\` <br /> \`world\`"
source: upstream:lydiahallie#1
---

\`\`\`javascript
console.log(1 + 1);
\`\`\`

## Explanation

It logs <b>two</b>, see <a href="https://example.com">this</a>.

![](images/sample-question-1.png)
`;

const DECK = {
  name: "Test",
  description: "A test deck.",
  licence: "MIT",
  upstream: {
    id: "lydiahallie",
    repo: "lydiahallie/javascript-questions",
    url: "https://github.com/lydiahallie/javascript-questions",
    branch: "master",
    commit: "a".repeat(40),
    anchors: { 1: "1-whats-the-output" },
  },
  order: ["sample-question"],
};

let root;

function writeDeck(name, { deck = DECK, files = { "sample-question.md": VALID }, images = ["sample-question-1.png"] } = {}) {
  const dir = join(root, name);
  mkdirSync(join(dir, "images"), { recursive: true });
  writeFileSync(join(dir, "deck.json"), JSON.stringify(deck));
  for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text);
  for (const img of images) writeFileSync(join(dir, "images", img), "");
}

const errorsFor = (text, opts = {}) => {
  writeDeck("javascript", { files: { "sample-question.md": text }, ...opts });
  return validateContent(root).errors.join("\n");
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "content-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("validateContent", () => {
  it("accepts a valid question, allowing <i>/<b>/<a>/<br> and HTML-like text inside code", () => {
    expect(errorsFor(VALID)).toBe("");
  });

  it("accepts a question with no code (the title is the question)", () => {
    expect(errorsFor(VALID.replace(/```javascript[\s\S]*?```\n\n/, ""))).toBe("");
  });

  const broken = [
    ["answer not among the options", (s) => s.replace("answer: B", "answer: C"), /answer: "C" is not one of the options/],
    ["option letters skip", (s) => s.replace("  B:", "  C:").replace("answer: B", "answer: C"), /letters must be A, B in order \(got A, C\)/],
    ["only one option", (s) => s.replace(/ {2}B: .*\n/, "").replace("answer: B", "answer: A"), /needs 2–6 options \(has 1\)/],
    ["seven options", (s) => s.replace(/( {2}B: .*\n)/, `$1${"CDEFG".split("").map((l) => `  ${l}: "x"\n`).join("")}`), /needs 2–6 options \(has 7\)/],
    ["empty option", (s) => s.replace('A: "`Promise {<pending>}`"', 'A: ""'), /options\.A: option text must not be empty/],
    ["id differs from file name", (s) => s.replace("id: sample-question", "id: other-question"), /id "other-question" does not match file name/],
    ["id not a slug", (s) => s.replace("id: sample-question", "id: Sample_Question"), /id: must be a kebab-case slug/],
    ["empty title", (s) => s.replace("title: What's the output?", 'title: ""'), /title: must not be empty/],
    ["source malformed", (s) => s.replace("source: upstream:lydiahallie#1", "source: lydiahallie#1"), /source: must be/],
    ["source from another upstream", (s) => s.replace("upstream:lydiahallie#1", "upstream:someone#1"), /does not match deck.json upstream/],
    ["source without an anchor", (s) => s.replace("upstream:lydiahallie#1", "upstream:lydiahallie#2"), /upstream.anchors has no entry for #2/],
    ["unknown frontmatter key", (s) => s.replace("source:", "difficult: 2\nsource:"), /Unrecognized key: "difficult"/],
    ["difficulty out of range", (s) => s.replace("source:", "difficulty: 4\nsource:"), /difficulty:/],
    ["frontmatter that is not YAML", (s) => s.replace("title: What's the output?", "title: [unclosed"), /frontmatter does not parse/],
    ["no explanation heading", (s) => s.replace("## Explanation", "## Answer"), /missing "## Explanation" heading/],
    ["empty explanation", (s) => s.replace(/## Explanation[\s\S]*$/, "## Explanation\n\n"), /explanation is empty/],
    ["two explanation headings", (s) => `${s}\n## Explanation\n\nAgain.\n`, /appears 2 times/],
    ["code fence without a language", (s) => s.replace("```javascript", "```"), /code fence has no language/],
    ["code fence with an unknown language", (s) => s.replace("```javascript", "```javscript"), /unknown code language "javscript"/],
    ["unclosed code fence", (s) => s.replace("console.log(1 + 1);\n```", "console.log(1 + 1);"), /code fence is never closed/],
    ["raw HTML in the explanation", (s) => s.replace("It logs", "<div>It logs</div>"), /body line \d+: raw HTML <div> is not allowed/],
    ["raw HTML in an option", (s) => s.replace('B: "`Hello`', 'B: "<span>x</span> `Hello`'), /option B: raw HTML <span>/],
    ["an <img> tag", (s) => s.replace("![](images/sample-question-1.png)", '<img src="images/sample-question-1.png">'), /raw HTML <img>/],
    ["an HTML comment", (s) => s.replace("It logs", "<!-- todo --> It logs"), /raw HTML <!-->/],
    ["a remote image", (s) => s.replace("images/sample-question-1.png", "https://i.imgur.com/x.png"), /must be a local file at images\/<name>/],
    ["a missing image", (s) => s.replace("sample-question-1.png", "nope.png"), /image "images\/nope.png" not found/],
    ["a reference-style image", (s) => s.replace("![](images/sample-question-1.png)", "![diagram][1]"), /use an inline image/],
  ];

  it.each(broken)("fails on %s", (_, breakIt, expected) => {
    expect(errorsFor(breakIt(VALID))).toMatch(expected);
  });

  it("fails when deck.json order and files disagree", () => {
    writeDeck("javascript", { deck: { ...DECK, order: ["sample-question", "ghost"] } });
    expect(validateContent(root).errors.join("\n")).toMatch(/order: "ghost" has no file ghost.md/);
    writeDeck("javascript", { deck: { ...DECK, order: [] } });
    expect(validateContent(root).errors.join("\n")).toMatch(/order: sample-question.md is not listed/);
  });

  it("fails when two files claim the same upstream question", () => {
    const twin = VALID.replace("id: sample-question", "id: twin-question");
    writeDeck("javascript", {
      deck: { ...DECK, order: ["sample-question", "twin-question"] },
      files: { "sample-question.md": VALID, "twin-question.md": twin },
    });
    expect(validateContent(root).errors.join("\n")).toMatch(/upstream #1 is also claimed by/);
  });

  it("fails when an id is reused in another deck", () => {
    writeDeck("javascript");
    writeDeck("other");
    expect(validateContent(root).errors.join("\n")).toMatch(/id "sample-question" is already used by/);
  });

  it("warns, without failing, about images nothing references", () => {
    writeDeck("javascript", { images: ["sample-question-1.png", "orphan.png"] });
    const { errors, warnings } = validateContent(root);
    expect(errors).toEqual([]);
    expect(warnings.join("\n")).toMatch(/orphan.png: not referenced/);
  });

  it("passes on the committed content", () => {
    const { errors, decks } = validateContent("content");
    expect(errors).toEqual([]);
    expect(decks).toEqual([{ name: "javascript", questions: 155 }]);
  });
});
