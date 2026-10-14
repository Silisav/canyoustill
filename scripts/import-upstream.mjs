// Imports lydiahallie/javascript-questions (MIT, Lydia Hallie) into content/javascript/ in the
// AGENTS.md "Content" format. The app never reads upstream at runtime; this script is the only bridge.
//
//   npm run import                  seed an empty deck from the upstream branch head
//   npm run import -- --force       re-import over an existing deck (keeps slugs, tags, difficulty;
//                                   overwrites local edits to upstream text)
//   npm run import -- --ref <sha>   import a specific upstream commit
//   npm run upstream:check          weekly: list upstream changes since the commit pinned in
//                                   deck.json and verify every "see the original" anchor.
//     --report <file>               also write the report as markdown when there is something to report
//
// Exit codes: 0 ok / nothing to report, 1 something to report (--check), 2 failure.
//
// Slugs are frozen: a question that already has a file keeps its id. New questions take theirs
// from seed-slugs.json, else get a placeholder from fallbackSlug() for a human to review.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import matter from "gray-matter";
import { CONTENT_DIR, listQuestionFiles, readQuestionFile, parseSource } from "./lib/content.mjs";
import { parseReadme, githubAnchor, fallbackSlug, diffQuestions } from "./lib/upstream.mjs";

const UPSTREAM = {
  id: "lydiahallie",
  repo: "lydiahallie/javascript-questions",
  url: "https://github.com/lydiahallie/javascript-questions",
  branch: "master",
};
const DECK_DEFAULTS = {
  name: "JavaScript",
  description: "Lydia Hallie's JavaScript questions, from lydiahallie/javascript-questions.",
  licence: "MIT",
  author: { name: "Lydia Hallie", url: "https://x.com/lydiahallie" },
};
const DECK_DIR = join(CONTENT_DIR, "javascript");
const DECK_PATH = join(DECK_DIR, "deck.json");
const IMAGES_DIR = join(DECK_DIR, "images");
const SEED_SLUGS = JSON.parse(readFileSync(new URL("./seed-slugs.json", import.meta.url), "utf8"));

// --- network -----------------------------------------------------------------------------

const API = "https://api.github.com";

async function get(url, { accept, binary = false } = {}) {
  const headers = { "User-Agent": "canyoustill-importer" };
  if (accept) headers.Accept = accept;
  if (url.startsWith(API)) {
    headers["X-GitHub-Api-Version"] = "2022-11-28";
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  if (!binary) return res.text();
  return { bytes: Buffer.from(await res.arrayBuffer()), finalUrl: res.url };
}

const headCommit = async () =>
  (await get(`${API}/repos/${UPSTREAM.repo}/commits/${UPSTREAM.branch}`, { accept: "application/vnd.github.sha" })).trim();

const rawFile = (sha, path) => get(`https://raw.githubusercontent.com/${UPSTREAM.repo}/${sha}/${path}`);

/** Heading ids on the live upstream README, as GitHub renders it. */
async function liveAnchors() {
  const html = await get(`${API}/repos/${UPSTREAM.repo}/readme`, { accept: "application/vnd.github.html" });
  return new Set([...html.matchAll(/id="user-content-([^"]+)"/g)].map((m) => decodeURIComponent(m[1])));
}

// --- images ------------------------------------------------------------------------------

const SIGNATURES = [
  [".png", (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  [".jpg", (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  [".gif", (b) => b.subarray(0, 4).toString("latin1") === "GIF8"],
  [".webp", (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP"],
];

/** Download an upstream image into images/<baseName>.<ext>; returns the file name. */
async function downloadImage(url, baseName) {
  const { bytes, finalUrl } = await get(url, { binary: true });
  if (/\/removed\.\w+$/.test(finalUrl)) throw new Error(`${url} has been removed by its host`);
  const ext = SIGNATURES.find(([, test]) => test(bytes))?.[0];
  if (!ext) throw new Error(`${url} did not return an image`);
  const file = `${baseName}${ext}`;
  writeFileSync(join(IMAGES_DIR, file), bytes);
  return file;
}

// --- writing question files --------------------------------------------------------------

const PLAIN_UNSAFE = /^[^A-Za-z0-9(]|[\n\t]|:(?:\s|$)|\s#|\s$|^(?:true|false|yes|no|on|off|null|y|n)$/i;

/** A YAML scalar: plain when that's unambiguous (titles), otherwise quoted. */
function yamlScalar(s, { quote = false } = {}) {
  if (!quote && !PLAIN_UNSAFE.test(s) && Number.isNaN(Number(s))) return s;
  // Double quotes read best; single quotes avoid escaping when the text has " or \ in it.
  if (!s.includes('"') && !s.includes("\\")) return JSON.stringify(s);
  return `'${s.replaceAll("'", "''")}'`;
}

function fenceFor(source) {
  let fence = "```";
  while (source.includes(fence)) fence += "`";
  return fence;
}

function renderQuestion(fm, code, explanation) {
  const out = ["---", `id: ${fm.id}`, `title: ${yamlScalar(fm.title)}`, `answer: ${fm.answer}`, "options:"];
  for (const [key, text] of Object.entries(fm.options)) out.push(`  ${key}: ${yamlScalar(text, { quote: true })}`);
  if (fm.tags?.length) out.push(`tags: [${fm.tags.join(", ")}]`);
  if (fm.difficulty) out.push(`difficulty: ${fm.difficulty}`);
  out.push(`source: ${fm.source}`, "---", "");
  for (const c of code) {
    const fence = fenceFor(c.source);
    out.push(`${fence}${c.lang}`, c.source, fence, "");
  }
  out.push("## Explanation", "", explanation, "");
  return out.join("\n");
}

/** Guard against YAML quoting mistakes: the file must parse back to exactly what we meant. */
function assertRoundTrip(text, fm, number) {
  const { data } = matter(text, {});
  const expected = Object.fromEntries(Object.entries(fm).filter(([, v]) => v !== undefined));
  if (JSON.stringify(data) !== JSON.stringify(expected)) {
    throw new Error(`#${number}: frontmatter does not round-trip\n${JSON.stringify(data)}\n${JSON.stringify(expected)}`);
  }
}

/** Upstream-sourced questions already in the deck, by upstream number. */
function readExisting() {
  const byNumber = new Map();
  const ids = new Set();
  if (!existsSync(DECK_DIR)) return { byNumber, ids };
  for (const file of listQuestionFiles(DECK_DIR)) {
    const q = readQuestionFile(join(DECK_DIR, file));
    ids.add(q.id);
    const src = parseSource(q.data.source);
    if (src?.upstream === UPSTREAM.id) byNumber.set(src.number, q);
  }
  return { byNumber, ids };
}

// --- import ------------------------------------------------------------------------------

async function importDeck({ force, ref }) {
  const oldDeck = existsSync(DECK_PATH) ? JSON.parse(readFileSync(DECK_PATH, "utf8")) : null;
  if (oldDeck && !force) {
    throw new Error(
      `${DECK_DIR} is already seeded. Run \`npm run upstream:check\` to see what changed upstream, ` +
        "or pass --force to re-import (keeps slugs, tags and difficulty; overwrites local edits to upstream text).",
    );
  }

  const existing = readExisting();
  const sha = ref ?? (await headCommit());
  console.log(`Importing ${UPSTREAM.repo}@${sha.slice(0, 7)}`);
  const [readme, licence] = await Promise.all([rawFile(sha, "README.md"), rawFile(sha, "LICENSE")]);
  const { questions, problems } = parseReadme(readme);
  for (const p of problems) console.warn(`  upstream: ${p}`);

  // Slugs: existing file > seed table > placeholder.
  const taken = new Set(existing.ids);
  const slugs = new Map();
  const placeholders = [];
  for (const q of questions) {
    let slug = existing.byNumber.get(q.number)?.id;
    if (!slug && SEED_SLUGS[q.number] && !taken.has(SEED_SLUGS[q.number])) slug = SEED_SLUGS[q.number];
    if (!slug) {
      slug = fallbackSlug(q, taken);
      placeholders.push(`#${q.number} → ${slug}`);
    }
    taken.add(slug);
    slugs.set(q.number, slug);
  }

  mkdirSync(IMAGES_DIR, { recursive: true });
  let images = 0;
  for (const q of questions) {
    const id = slugs.get(q.number);
    const prev = existing.byNumber.get(q.number)?.data;

    let explanation = q.explanation;
    for (const [i, img] of q.images.entries()) {
      const file = await downloadImage(img.url, `${id}-${i + 1}`);
      explanation = explanation.replace(img.tag, `![](images/${file})`);
      images++;
    }

    const fm = {
      id,
      title: q.title,
      answer: q.answer,
      options: Object.fromEntries(q.options.map((o) => [o.key, o.text])),
      tags: prev?.tags,
      difficulty: prev?.difficulty,
      source: `upstream:${UPSTREAM.id}#${q.number}`,
    };
    const text = renderQuestion(fm, q.code, explanation);
    assertRoundTrip(text, fm, q.number);
    writeFileSync(join(DECK_DIR, `${id}.md`), text);
  }

  const order = [...(oldDeck?.order ?? [])];
  for (const q of questions) if (!order.includes(slugs.get(q.number))) order.push(slugs.get(q.number));

  const anchors = Object.fromEntries(questions.map((q) => [String(q.number), githubAnchor(q.heading)]));
  const deck = {
    name: oldDeck?.name ?? DECK_DEFAULTS.name,
    description: oldDeck?.description ?? DECK_DEFAULTS.description,
    licence: oldDeck?.licence ?? DECK_DEFAULTS.licence,
    author: oldDeck?.author ?? DECK_DEFAULTS.author,
    upstream: { ...UPSTREAM, commit: sha, anchors },
    order,
  };
  writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + "\n");
  writeFileSync(join(DECK_DIR, "LICENSE"), licence);

  const gone = [...existing.byNumber.keys()].filter((n) => !questions.some((q) => q.number === n));
  console.log(`Wrote ${questions.length} questions and ${images} images to ${DECK_DIR}/`);
  for (const p of placeholders) console.warn(`  placeholder slug, review before merging: ${p}`);
  for (const n of gone) console.warn(`  #${n} is no longer upstream: ${existing.byNumber.get(n).path}`);

  const live = await liveAnchors();
  const broken = Object.entries(anchors).filter(([, a]) => !live.has(a));
  if (broken.length) {
    throw new Error(`Anchors not found on the live upstream README: ${broken.map(([n, a]) => `#${n} ${a}`).join(", ")}`);
  }
  console.log(`Verified ${Object.keys(anchors).length} "see the original" anchors against the live upstream README`);
}

// --- check -------------------------------------------------------------------------------

async function check({ report }) {
  if (!existsSync(DECK_PATH)) throw new Error(`${DECK_PATH} not found; run \`npm run import\` first`);
  const deck = JSON.parse(readFileSync(DECK_PATH, "utf8"));
  const pinned = deck.upstream.commit;
  const head = await headCommit();
  const existing = readExisting();
  const fileFor = (n) => (existing.byNumber.has(n) ? `\`${existing.byNumber.get(n).path}\`` : "(no file)");
  const out = [];

  if (head !== pinned) {
    const [before, after] = await Promise.all(
      [pinned, head].map(async (sha) => parseReadme(await rawFile(sha, "README.md")).questions),
    );
    const { added, removed, changed } = diffQuestions(before, after);
    if (added.length || removed.length || changed.length) {
      out.push(
        `[${UPSTREAM.repo}](${UPSTREAM.url}) changed since the commit pinned in \`${DECK_PATH}\` ` +
          `(\`${pinned.slice(0, 7)}\` → \`${head.slice(0, 7)}\`, [compare](${UPSTREAM.url}/compare/${pinned}...${head})).`,
        "",
      );
      if (changed.length) {
        out.push("**Changed**", ...changed.map((c) => `- #${c.number} ${fileFor(c.number)}: ${c.fields.join(", ")}`), "");
      }
      if (added.length) out.push("**Added**", ...added.map((q) => `- #${q.number} “${q.title}”`), "");
      if (removed.length) out.push("**Removed upstream**", ...removed.map((q) => `- #${q.number} ${fileFor(q.number)}`), "");
      out.push(
        "To take the changes: edit the files above by hand and set `upstream.commit` in deck.json to " +
          `\`${head}\`, or run \`npm run import -- --force\` (re-imports everything; overwrites local edits to upstream text).`,
        "",
      );
    } else {
      console.log(`Upstream moved ${pinned.slice(0, 7)} → ${head.slice(0, 7)} without changing any question.`);
    }
  }

  const live = await liveAnchors();
  const broken = [...existing.byNumber.keys()]
    .sort((a, b) => a - b)
    .filter((n) => !live.has(deck.upstream.anchors[n]));
  if (broken.length) {
    out.push(
      "**Broken “see the original” links**",
      ...broken.map((n) => `- #${n} ${fileFor(n)}: \`#${deck.upstream.anchors[n] ?? "?"}\` is not on the upstream README`),
      "",
    );
  }

  if (!out.length) {
    console.log(`Upstream unchanged at ${head.slice(0, 7)}; ${existing.byNumber.size} source anchors resolve.`);
    return 0;
  }
  const text = out.join("\n");
  console.log(text);
  if (report) writeFileSync(report, text);
  return 1;
}

// --- CLI ---------------------------------------------------------------------------------

const { values } = parseArgs({
  options: {
    check: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    ref: { type: "string" },
    report: { type: "string" },
  },
});

try {
  process.exitCode = values.check ? await check(values) : (await importDeck(values), 0);
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exitCode = 2;
}
