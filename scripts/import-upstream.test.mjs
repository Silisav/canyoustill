import { describe, it, expect } from "vitest";
import { githubAnchor, parseReadme, diffQuestions, fallbackSlug } from "./lib/upstream.mjs";

describe("githubAnchor", () => {
  // Ids copied from GitHub's rendered upstream README.
  it.each([
    ["1. What's the output?", "1-whats-the-output"],
    ["22. How long is cool_secret accessible?", "22-how-long-is-cool_secret-accessible"],
    [
      "86. Which option is a way to set `hasName` equal to `true`, provided you cannot pass `true` as an argument?",
      "86-which-option-is-a-way-to-set-hasname-equal-to-true-provided-you-cannot-pass-true-as-an-argument",
    ],
    ["115. Which method(s) will return the value `'Hello world!'`?", "115-which-methods-will-return-the-value-hello-world"],
    ["134. How can we invoke `sum` in `sum.js` from `index.js?`", "134-how-can-we-invoke-sum-in-sumjs-from-indexjs"],
    [
      '153. What should the value of `method` be to log `{ name: "Lydia", age: 22 }`?',
      "153-what-should-the-value-of-method-be-to-log--name-lydia-age-22-",
    ],
  ])("%s", (heading, id) => expect(githubAnchor(heading)).toBe(id));
});

const README = `# Title

---

###### 1. What's the output?

\`\`\`javascript
let c = { greeting: 'Hey!' };
\`\`\`

- A: \`Hello\`
- B: \`Hey!\`

<details><summary><b>Answer</b></summary>
<p>

#### Answer: A

Objects interact by _reference_.

<img src="https://i.imgur.com/ko5k0fs.png" width="200">

</p>
</details>

---

###### 2. Everything in JavaScript is either a...

- A: primitive or object
- B: function or object

<details><summary><b>Answer</b></summary>
<p>

#### Answer: A

JavaScript only has primitive types and objects.

</p>
</details>
`;

describe("parseReadme", () => {
  const { questions, problems } = parseReadme(README);

  it("reads number, title, code, options, answer, explanation and images", () => {
    expect(problems).toEqual([]);
    expect(questions).toHaveLength(2);
    const [q1, q2] = questions;
    expect(q1).toMatchObject({
      number: 1,
      title: "What's the output?",
      heading: "1. What's the output?",
      code: [{ lang: "javascript", source: "let c = { greeting: 'Hey!' };" }],
      options: [
        { key: "A", text: "`Hello`" },
        { key: "B", text: "`Hey!`" },
      ],
      answer: "A",
      images: [{ url: "https://i.imgur.com/ko5k0fs.png" }],
    });
    expect(q1.explanation).toMatch(/^Objects interact by _reference_\.\n\n<img [^>]+>$/);
    expect(q2).toMatchObject({ number: 2, code: [], answer: "A" });
  });

  it("reports questions that don't fit the expected shape", () => {
    const { problems } = parseReadme(README.replace("#### Answer: A\n\nJavaScript", "#### Answer: \n\nJavaScript"));
    expect(problems).toEqual(['#2: expected one answer letter, found ""']);
  });
});

describe("diffQuestions", () => {
  it("lists added, removed and changed questions with the fields that changed", () => {
    const { questions: before } = parseReadme(README);
    const { questions: after } = parseReadme(
      README.replace("Objects interact", "Objects always interact").replace(/###### 2\.[\s\S]*$/, "") +
        "###### 3. New one?\n\n- A: yes\n- B: no\n\n<details>\n<p>\n\n#### Answer: B\n\nBecause.\n\n</p>\n</details>\n",
    );
    const { added, removed, changed } = diffQuestions(before, after);
    expect(added.map((q) => q.number)).toEqual([3]);
    expect(removed.map((q) => q.number)).toEqual([2]);
    expect(changed).toMatchObject([{ number: 1, fields: ["explanation"] }]);
  });
});

describe("fallbackSlug", () => {
  const q = (title, code = "", number = 156) => ({ number, title, code: code ? [{ source: code }] : [] });

  it("uses meaningful title words when there are any", () => {
    expect(fallbackSlug(q("Is this a pure function?"), new Set())).toBe("pure-function");
  });

  it("adds a construct from the code to a generic title", () => {
    expect(fallbackSlug(q("What's the output?", "setTimeout(() => console.log(1));"), new Set())).toBe("settimeout");
  });

  it("disambiguates a taken slug with the upstream number", () => {
    expect(fallbackSlug(q("What's the output?", "setTimeout(f);"), new Set(["settimeout"]))).toBe("settimeout-156");
  });
});
