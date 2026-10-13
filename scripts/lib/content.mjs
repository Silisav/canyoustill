// Shared rules for content/<deck>/ (AGENTS.md "Content"). Used by validate.mjs and import-upstream.mjs.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import { z } from "zod";

export const CONTENT_DIR = "content";
export const LETTERS = "ABCDEF";
export const EXPLANATION_HEADING = "## Explanation";
export const ALLOWED_HTML = new Set(["i", "b", "a", "br"]);
export const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"]);
// Languages Shiki will be asked to highlight. Extend deliberately.
export const CODE_LANGUAGES = new Set(["javascript", "js", "html", "css", "json", "text"]);

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SOURCE_RE = /^(?:upstream:([a-z0-9-]+)#([1-9]\d*)|community)$/;

const slug = z.string().regex(SLUG_RE, "must be a kebab-case slug (a-z, 0-9, single hyphens)");

export const questionSchema = z.strictObject({
  id: slug,
  title: z.string().trim().min(1, "must not be empty"),
  answer: z.string(),
  options: z.record(z.string(), z.string().trim().min(1, "option text must not be empty")),
  tags: z.array(slug).optional(),
  difficulty: z.int().min(1).max(3).optional(),
  source: z.string().regex(SOURCE_RE, 'must be "upstream:<name>#<number>" or "community"'),
  author: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/, "must be a GitHub handle").optional(),
});

export const deckSchema = z.strictObject({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  licence: z.string().trim().min(1),
  /** Who wrote the questions: credited by name in the footer and on About, linked to them. */
  author: z.strictObject({ name: z.string().trim().min(1), url: z.url() }).optional(),
  upstream: z
    .strictObject({
      id: slug,
      repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
      url: z.url(),
      branch: z.string().min(1),
      commit: z.string().regex(/^[0-9a-f]{40}$/, "must be a full commit sha"),
      anchors: z.record(z.string().regex(/^[1-9]\d*$/), z.string().min(1)),
    })
    .optional(),
  order: z.array(slug),
});

/** List deck directories under the content root. Scripts only; the app lists its own. */
export function listDecks(contentDir = CONTENT_DIR) {
  // The ignore comments stop Next's bundler tracing the whole project when the app imports
  // this module for its parsing helpers.
  if (!existsSync(/*turbopackIgnore: true*/ contentDir)) return [];
  return readdirSync(/*turbopackIgnore: true*/ contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

/** Question files in a deck, sorted by name. */
export function listQuestionFiles(deckDir) {
  return readdirSync(deckDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();
}

/** Read and split one question file. Throws on unparseable frontmatter. */
export function readQuestionFile(path) {
  const raw = readFileSync(path, "utf8");
  // gray-matter caches by content; pass an options object to bypass the cache.
  const { data, content } = matter(raw, {});
  return { path, id: basename(path, ".md"), raw, data, body: content };
}

/** Upstream reference from a `source` value, or null for community questions. */
export function parseSource(source) {
  const m = typeof source === "string" && source.match(SOURCE_RE);
  if (!m || !m[1]) return null;
  return { upstream: m[1], number: Number(m[2]) };
}

/**
 * Fenced code blocks, CommonMark-style: up to 3 spaces of indent, ``` or ~~~ (3+),
 * closed by the same character at least as long. Lines are 1-based.
 */
export function scanFences(markdown) {
  const lines = markdown.split("\n");
  const fences = [];
  let open = null;
  lines.forEach((line, i) => {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!open) {
      if (!m) return;
      if (m[1][0] === "`" && m[2].includes("`")) return; // not a fence (inline code)
      open = { char: m[1][0], size: m[1].length, info: m[2].trim(), start: i + 1, end: null };
    } else if (m && m[1][0] === open.char && m[1].length >= open.size && m[2].trim() === "") {
      fences.push({ ...open, end: i + 1 });
      open = null;
    }
  });
  if (open) fences.push(open);
  return fences;
}

/** Markdown with fenced blocks and inline code spans removed, line count preserved. */
export function stripCode(markdown) {
  const lines = markdown.split("\n");
  for (const f of scanFences(markdown)) {
    for (let i = f.start - 1; i < (f.end ?? lines.length); i++) lines[i] = "";
  }
  return lines.join("\n").replace(/(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, (s) => s.replace(/[^\n]/g, " "));
}

/** Raw HTML outside code: [{ tag, line }]. Comments count as tag "!--". */
export function findHtml(markdown) {
  const text = stripCode(markdown);
  const found = [];
  const lineOf = (index) => text.slice(0, index).split("\n").length;
  for (const m of text.matchAll(/<(\/?)([A-Za-z][A-Za-z0-9-]*)(?=[\s/>])[^>]*>/g)) {
    found.push({ tag: m[2].toLowerCase(), line: lineOf(m.index) });
  }
  for (const m of text.matchAll(/<!--/g)) found.push({ tag: "!--", line: lineOf(m.index) });
  return found;
}

/** Markdown images outside code: [{ alt, src, line }], plus reference-style ones as { ref: true }. */
export function findImages(markdown) {
  const text = stripCode(markdown);
  const lineOf = (index) => text.slice(0, index).split("\n").length;
  const images = [];
  for (const m of text.matchAll(/!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+["'(][^)]*)?\)/g)) {
    images.push({ alt: m[1], src: m[2], line: lineOf(m.index) });
  }
  for (const m of text.matchAll(/!\[[^\]]*\]\[[^\]]*\]/g)) {
    images.push({ ref: true, src: m[0], line: lineOf(m.index) });
  }
  return images;
}

/**
 * Split a question body at the explanation heading (ignoring headings inside code).
 * Returns { question, explanation, headings } where headings counts matches.
 */
export function splitBody(body) {
  const lines = body.split("\n");
  const inFence = new Set();
  for (const f of scanFences(body)) {
    for (let i = f.start - 1; i < (f.end ?? lines.length); i++) inFence.add(i);
  }
  const at = lines.flatMap((l, i) => (!inFence.has(i) && l.trim() === EXPLANATION_HEADING ? [i] : []));
  if (at.length === 0) return { question: body, explanation: null, headings: 0 };
  return {
    question: lines.slice(0, at[0]).join("\n"),
    explanation: lines.slice(at[0] + 1).join("\n"),
    headings: at.length,
  };
}
