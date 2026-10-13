// Builds a deck bundle from content/<deck>/ at build time (AGENTS.md "Architecture"). Content
// has already passed scripts/validate.mjs (prebuild), so this trusts its shape and its HTML.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Marked, type Tokens } from "marked";
import {
  readQuestionFile,
  parseSource,
  scanFences,
  splitBody,
} from "../../../scripts/lib/content.mjs";
import { highlight } from "./highlight";
import type { CodeBlock, CodeSize, Deck, Question } from "./types";
import { externalIconHtml, NEW_TAB, splitLastWord } from "../external-link";

// Statically scoped so the bundler traces content/ only, not the whole project.
const CONTENT = join(process.cwd(), "content");

export const deckIds = (): string[] =>
  readdirSync(CONTENT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();

export const imagesDir = (deck: string) => join(CONTENT, deck, "images");

export function deckImages(deck: string): string[] {
  const dir = imagesDir(deck);
  return existsSync(dir) ? readdirSync(dir).filter((f) => !f.startsWith(".")) : [];
}

/** Font step for a code block from its longest line (AGENTS.md "Type"). */
export function codeSize(source: string): CodeSize {
  const longest = Math.max(...source.split("\n").map((l) => l.length));
  return longest > 58 ? "longer" : longest > 44 ? "long" : "base";
}

const FILE_HEADER = /^\/\/ ([\w.-]+\.(?:m?js|cjs|ts|json|html|css))\s*$/;

/**
 * A block that starts with `// name.js` holds one or more files: split it at every such line so
 * each file gets its own block with a filename row.
 */
export function splitFiles(source: string): { file: string | null; source: string }[] {
  const lines = source.split("\n");
  if (!FILE_HEADER.test(lines[0])) return [{ file: null, source }];
  const files: { file: string; lines: string[] }[] = [];
  for (const line of lines) {
    const header = line.match(FILE_HEADER);
    if (header) files.push({ file: header[1], lines: [] });
    else files[files.length - 1].lines.push(line);
  }
  return files.map((f) => ({ file: f.file, source: f.lines.join("\n").replace(/^\n+|\n+$/g, "") }));
}

/** Plain text of rendered inline HTML, for the typed output line. */
export function toPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .trim();
}

/** Width and height of a PNG from its header, or null for anything else. */
function pngSize(path: string): { width: number; height: number } | null {
  const b = readFileSync(path);
  if (b.length < 24 || b.readUInt32BE(12) !== 0x49484452) return null; // "IHDR"
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/**
 * External links (content links are always absolute http(s)) open in a new tab and end in the ↗,
 * kept on the line with their last word, like the app's own (AGENTS.md "External links").
 */
const externalLinks = (html: string) =>
  html.replace(/<a href="(https?:[^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (_, href: string, attrs: string, inner: string) => {
    const [head, last] = splitLastWord(inner);
    const tail = last.includes("<") ? `${inner}${externalIconHtml}` : `${head}<span class="whitespace-nowrap">${last}${externalIconHtml}</span>`;
    return `<a href="${href}"${attrs} target="_blank" rel="noopener">${tail}<span class="sr-only">${NEW_TAB}</span></a>`;
  });

function markdown(deck: string) {
  // Fenced code inside explanations is highlighted after marked runs (marked is synchronous,
  // Shiki is not), so the renderer leaves a placeholder per block.
  const pending: { lang: string; code: string }[] = [];
  const md = new Marked({
    gfm: true,
    renderer: {
      code({ text, lang }: Tokens.Code) {
        pending.push({ lang: (lang ?? "").split(/\s+/)[0], code: text });
        return `<pre>%%code-${pending.length - 1}%%</pre>\n`;
      },
      image({ href, text }: Tokens.Image) {
        const file = href.replace(/^images\//, "");
        const size = pngSize(join(imagesDir(deck), file));
        // Upstream diagrams are 2× exports: show them at half their pixel size.
        const dims = size ? ` width="${Math.round(size.width / 2)}" height="${Math.round(size.height / 2)}"` : "";
        return `<img src="/decks/${deck}/images/${escapeAttr(file)}" alt="${escapeAttr(text)}"${dims} loading="lazy" decoding="async">`;
      },
    },
  });

  return {
    inline: (src: string) => externalLinks(md.parseInline(src, { async: false })),
    async block(src: string) {
      pending.length = 0;
      let html = md.parse(src, { async: false });
      const blocks = [...pending];
      const highlighted = await Promise.all(blocks.map((b) => highlight(b.code, b.lang)));
      html = html.replace(/%%code-(\d+)%%/g, (_, i) => `<code>${highlighted[Number(i)]}</code>`);
      return externalLinks(html);
    },
  };
}

async function buildQuestion(
  deck: string,
  path: string,
  upstream: { url: string; anchors: Record<string, string> } | undefined,
  md: ReturnType<typeof markdown>,
): Promise<Question> {
  const q = readQuestionFile(path);
  const fm = q.data as {
    id: string;
    title: string;
    answer: string;
    options: Record<string, string>;
    source: string;
    author?: string;
  };
  const { question, explanation } = splitBody(q.body);

  const code: CodeBlock[] = [];
  const lines = question.split("\n");
  for (const fence of scanFences(question)) {
    const source = lines.slice(fence.start, (fence.end ?? lines.length) - 1).join("\n");
    const lang = fence.info.split(/\s+/)[0];
    for (const part of splitFiles(source)) {
      code.push({ file: part.file, html: await highlight(part.source, lang), size: codeSize(part.source) });
    }
  }

  const options = Object.entries(fm.options).map(([key, text]) => ({ key, html: md.inline(text) }));
  const src = parseSource(fm.source);
  const anchor = src && upstream?.anchors[String(src.number)];

  return {
    id: fm.id,
    number: src?.number ?? null,
    sourceUrl: anchor ? `${upstream!.url}#${anchor}` : null,
    author: fm.author ?? null,
    titleHtml: md.inline(fm.title),
    code,
    options,
    answer: fm.answer,
    output: toPlain(options.find((o) => o.key === fm.answer)!.html),
    explanationHtml: await md.block(explanation ?? ""),
  };
}

// One build per deck per process in production: the deck bundle, 155 question pages and 155 share
// images all read it. In development, content edits show on the next request.
const built = new Map<string, Promise<Deck>>();

export function buildDeck(deck: string): Promise<Deck> {
  if (process.env.NODE_ENV !== "production") return buildDeckNow(deck);
  if (!built.has(deck)) built.set(deck, buildDeckNow(deck));
  return built.get(deck)!;
}

async function buildDeckNow(deck: string): Promise<Deck> {
  const dir = join(CONTENT, deck);
  const meta = JSON.parse(readFileSync(join(dir, "deck.json"), "utf8")) as {
    name: string;
    upstream?: { url: string; anchors: Record<string, string> };
    author?: { name: string; url: string };
    order: string[];
  };
  const md = markdown(deck);
  const questions: Question[] = [];
  // Sequential: the markdown renderer collects code blocks per explanation.
  for (const id of meta.order) questions.push(await buildQuestion(deck, join(dir, `${id}.md`), meta.upstream, md));
  const version = createHash("sha256").update(JSON.stringify(questions)).digest("hex").slice(0, 12);
  return { id: deck, name: meta.name, upstreamUrl: meta.upstream?.url ?? null, author: meta.author ?? null, version, questions };
}
