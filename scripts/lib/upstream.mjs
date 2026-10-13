// Parsing and diffing for the lydiahallie/javascript-questions README (AGENTS.md "Importer").

/**
 * GitHub's heading anchor (github-slugger): lowercase, drop everything that isn't a letter,
 * mark, number, connector punctuation, space or hyphen, then spaces -> hyphens.
 */
export function githubAnchor(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replace(/ /g, "-");
}

/**
 * Parse the upstream README into questions:
 * { number, title, heading, code: [{ lang, source }], options: [{ key, text }], answer, explanation, images }
 * plus `problems` for anything that doesn't fit the expected shape.
 */
export function parseReadme(readme) {
  const src = readme.replace(/\r\n/g, "\n");
  const blocks = src.split(/^(?=###### \d+\. )/m).slice(1);
  const questions = [];
  const problems = [];

  for (const block of blocks) {
    const head = block.match(/^###### (\d+)\. (.+?)\s*$/m);
    const number = Number(head[1]);
    const title = head[2].trim();
    const problem = (msg) => problems.push(`#${number}: ${msg}`);

    const detailsAt = block.indexOf("<details>");
    if (detailsAt === -1) {
      problem("no <details> answer block");
      continue;
    }
    const body = block.slice(head[0].length, detailsAt);
    const details = block.slice(detailsAt, block.indexOf("</details>", detailsAt));

    const code = [...body.matchAll(/^```(\w*)[^\n]*\n([\s\S]*?)^```[ \t]*$/gm)].map((m) => ({
      lang: m[1] || "javascript",
      source: m[2].replace(/\n$/, ""),
    }));
    const options = [...body.matchAll(/^- ([A-Z]): (.*)$/gm)].map((m) => ({ key: m[1], text: m[2].trim() }));

    const leftover = body
      .replace(/^```[\s\S]*?^```[ \t]*$/gm, "")
      .replace(/^- [A-Z]: .*$/gm, "")
      .trim();
    if (leftover) problem(`unexpected text in question: ${JSON.stringify(leftover.slice(0, 80))}`);

    const answerLine = details.match(/^#### Answer:[ \t]*(.*?)[ \t]*$/m);
    const answers = answerLine ? answerLine[1].match(/\b[A-Z]\b/g) ?? [] : [];
    if (answers.length !== 1) problem(`expected one answer letter, found "${answerLine?.[1] ?? ""}"`);

    const explanation = answerLine
      ? details
          .slice(answerLine.index + answerLine[0].length)
          .replace(/<\/p>\s*$/, "")
          .trim()
      : "";
    if (!explanation) problem("empty explanation");

    const images = [...explanation.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map((m) => ({
      tag: m[0],
      url: m[1],
    }));

    questions.push({
      number,
      title,
      heading: `${number}. ${title}`,
      code,
      options,
      answer: answers[0] ?? null,
      explanation,
      images,
    });
  }

  const numbers = questions.map((q) => q.number);
  numbers.forEach((n, i) => {
    if (n !== i + 1) problems.push(`question numbers are not sequential at position ${i + 1} (#${n})`);
  });

  return { questions, problems };
}

// --- Fallback slugs for questions that aren't in the seed table ---------------------------
// Title words minus filler, plus the rarest recognisable construct in the code. These are
// placeholders for a human to review in the PR that adds the question.

const FILLER = new Set(
  ("a an and are be by can do does for from get happen happens how in into is it its of on one or " +
    "output return returns should that the these this to value values was we what whats when which " +
    "will with would you following option options logged statement").split(" "),
);

const CONSTRUCTS = [
  ["proxy", /\bnew Proxy\b/], ["symbol", /\bSymbol\b/], ["generator", /function\s*\*/],
  ["async", /\basync\b/], ["await", /\bawait\b/], ["promise", /\bPromise\b/],
  ["settimeout", /\bsetTimeout\b/], ["setinterval", /\bsetInterval\b/], ["class", /\bclass\b/],
  ["super", /\bsuper\b/], ["static", /\bstatic\b/], ["getter", /\bget\s+\w+\s*\(/],
  ["setter", /\bset\s+\w+\s*\(/], ["prototype", /\.prototype\b/], ["this", /\bthis\b/],
  ["typeof", /\btypeof\b/], ["delete", /\bdelete\b/], ["import", /^\s*import\b/m],
  ["export", /^\s*export\b/m], ["try-catch", /\btry\s*\{/], ["throw", /\bthrow\b/],
  ["map", /\bnew Map\b/], ["set", /\bnew Set\b/], ["json", /\bJSON\./], ["regex", /\/.+\/\.test\(/],
  ["object", /\bObject\.\w+/], ["optional-chaining", /\?\./], ["spread", /\.\.\.\w/],
  ["template-literal", /`[^`]*\$\{/], ["arrow-function", /=>/], ["closure", /return\s+\(?\w*\)?\s*=>/],
  ["array", /\.(?:map|filter|reduce|push|pop|splice|slice|flat|find|forEach|indexOf)\(/],
  ["let", /\blet\b/], ["var", /\bvar\b/], ["const", /\bconst\b/], ["function", /\bfunction\b/],
];

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A placeholder slug from title words + the first recognisable construct in the code. */
export function fallbackSlug(question, taken) {
  const words = slugify(question.title)
    .split("-")
    .filter((w) => w && !FILLER.has(w))
    .slice(0, 4);
  const code = question.code.map((c) => c.source).join("\n");
  const construct = CONSTRUCTS.find(([, re]) => re.test(code))?.[0];
  const parts = [...words, construct].filter(Boolean);
  let base = parts.length ? parts.join("-") : "question";
  if (!taken.has(base)) return base;
  return `${base}-${question.number}`;
}

// --- Diff between two parsed READMEs -------------------------------------------------------

const FIELDS = ["title", "code", "options", "answer", "explanation"];

/** Compare two parse results by question number. */
export function diffQuestions(before, after) {
  const a = new Map(before.map((q) => [q.number, q]));
  const b = new Map(after.map((q) => [q.number, q]));
  const added = after.filter((q) => !a.has(q.number));
  const removed = before.filter((q) => !b.has(q.number));
  const changed = [];
  for (const q of after) {
    const old = a.get(q.number);
    if (!old) continue;
    const fields = FIELDS.filter((f) => JSON.stringify(old[f]) !== JSON.stringify(q[f]));
    if (fields.length) changed.push({ number: q.number, title: q.title, fields, before: old, after: q });
  }
  return { added, removed, changed };
}
