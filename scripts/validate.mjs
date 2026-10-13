// Schema check for content/<deck>/ (AGENTS.md "Content"). Runs on `npm run validate`, as `prebuild`
// (so a broken question fails `npm run build`) and in CI. Exit code 1 on any error.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CONTENT_DIR,
  LETTERS,
  ALLOWED_HTML,
  IMAGE_EXTENSIONS,
  CODE_LANGUAGES,
  EXPLANATION_HEADING,
  questionSchema,
  deckSchema,
  listDecks,
  listQuestionFiles,
  readQuestionFile,
  parseSource,
  scanFences,
  findHtml,
  findImages,
  splitBody,
} from "./lib/content.mjs";

const zodMessages = (error) =>
  error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));

/**
 * Validate every deck under `contentDir`.
 * @returns {{ errors: string[], warnings: string[], decks: { name: string, questions: number }[] }}
 */
export function validateContent(contentDir = CONTENT_DIR) {
  const errors = [];
  const warnings = [];
  const decks = [];
  const idOwners = new Map(); // id -> file, across all decks

  const decksFound = listDecks(contentDir);
  if (decksFound.length === 0) errors.push(`${contentDir}: no decks found`);

  for (const deckName of decksFound) {
    const deckDir = join(contentDir, deckName);
    const rel = (p) => relative(process.cwd(), p) || p;
    const err = (file, msg) => errors.push(`${rel(file)}: ${msg}`);

    // --- deck.json -------------------------------------------------------------------------
    const deckPath = join(deckDir, "deck.json");
    let deck = null;
    if (!existsSync(deckPath)) {
      err(deckPath, "missing");
    } else {
      try {
        const parsed = deckSchema.safeParse(JSON.parse(readFileSync(deckPath, "utf8")));
        if (parsed.success) deck = parsed.data;
        else for (const m of zodMessages(parsed.error)) err(deckPath, m);
      } catch (e) {
        err(deckPath, `invalid JSON: ${e.message}`);
      }
    }

    // --- question files --------------------------------------------------------------------
    const files = listQuestionFiles(deckDir);
    const upstreamNumbers = new Map(); // number -> file
    const referencedImages = new Set();

    for (const file of files) {
      const path = join(deckDir, file);
      const e = (msg) => err(path, msg);

      let q;
      try {
        q = readQuestionFile(path);
      } catch (ex) {
        e(`frontmatter does not parse: ${ex.reason ?? ex.message}`);
        continue;
      }

      const parsed = questionSchema.safeParse(q.data);
      if (!parsed.success) {
        for (const m of zodMessages(parsed.error)) e(m);
        continue;
      }
      const fm = parsed.data;

      // id: matches file name, unique across all decks
      if (fm.id !== q.id) e(`id "${fm.id}" does not match file name "${q.id}.md"`);
      if (idOwners.has(fm.id)) e(`id "${fm.id}" is already used by ${rel(idOwners.get(fm.id))}`);
      else idOwners.set(fm.id, path);

      // options: 2–6, sequential letters from A; answer is one of them
      const keys = Object.keys(fm.options);
      if (keys.length < 2 || keys.length > LETTERS.length) {
        e(`options: needs 2–${LETTERS.length} options (has ${keys.length})`);
      }
      const expected = LETTERS.slice(0, keys.length).split("");
      if (keys.join() !== expected.join()) {
        e(`options: letters must be ${expected.join(", ")} in order (got ${keys.join(", ")})`);
      }
      if (!keys.includes(fm.answer)) {
        e(`answer: "${fm.answer}" is not one of the options (${keys.join(", ")})`);
      }

      // source: upstream questions point at this deck's upstream, once each, with an anchor
      const src = parseSource(fm.source);
      if (src) {
        if (!deck?.upstream) {
          e(`source: "${fm.source}" but deck.json has no upstream`);
        } else {
          if (src.upstream !== deck.upstream.id) {
            e(`source: upstream "${src.upstream}" does not match deck.json upstream "${deck.upstream.id}"`);
          }
          if (!deck.upstream.anchors[src.number]) {
            e(`source: deck.json upstream.anchors has no entry for #${src.number}`);
          }
        }
        if (upstreamNumbers.has(src.number)) {
          e(`source: upstream #${src.number} is also claimed by ${rel(upstreamNumbers.get(src.number))}`);
        } else upstreamNumbers.set(src.number, path);
      }

      // body: question part, then exactly one explanation heading with text under it
      const { explanation, headings } = splitBody(q.body);
      if (headings === 0) e(`body: missing "${EXPLANATION_HEADING}" heading`);
      if (headings > 1) e(`body: "${EXPLANATION_HEADING}" appears ${headings} times`);
      if (explanation !== null && explanation.trim() === "") e("body: explanation is empty");

      // code fences: closed, with a known language
      for (const f of scanFences(q.body)) {
        const where = `body line ${f.start}`;
        if (f.end === null) e(`${where}: code fence is never closed`);
        const lang = f.info.split(/\s+/)[0];
        if (!lang) e(`${where}: code fence has no language`);
        else if (!CODE_LANGUAGES.has(lang)) {
          e(`${where}: unknown code language "${lang}" (allowed: ${[...CODE_LANGUAGES].join(", ")})`);
        }
      }

      // raw HTML: only <i>, <b>, <a>, <br> outside code, in title, options and body
      const htmlChecks = [
        ["title", fm.title],
        ...keys.map((k) => [`option ${k}`, fm.options[k]]),
        ["body", q.body],
      ];
      for (const [where, text] of htmlChecks) {
        for (const { tag, line } of findHtml(text)) {
          if (ALLOWED_HTML.has(tag)) continue;
          const at = where === "body" ? `body line ${line}` : where;
          e(`${at}: raw HTML <${tag}> is not allowed (only ${[...ALLOWED_HTML].map((t) => `<${t}>`).join(", ")})`);
        }
      }

      // images: local files under content/<deck>/images/
      for (const img of findImages(q.body)) {
        const at = `body line ${img.line}`;
        if (img.ref) {
          e(`${at}: use an inline image, not a reference-style one (${img.src})`);
          continue;
        }
        const m = img.src.match(/^images\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
        if (!m) {
          e(`${at}: image "${img.src}" must be a local file at images/<name> (relative to the question)`);
          continue;
        }
        if (!IMAGE_EXTENSIONS.has(extname(m[1]).toLowerCase())) {
          e(`${at}: image "${img.src}" has an unsupported type`);
        } else if (!existsSync(join(deckDir, "images", m[1]))) {
          e(`${at}: image "${img.src}" not found in ${rel(join(deckDir, "images"))}/`);
        }
        referencedImages.add(m[1]);
      }
    }

    // --- deck order covers exactly the files ----------------------------------------------
    if (deck) {
      const seen = new Set();
      for (const id of deck.order) {
        if (seen.has(id)) err(deckPath, `order: "${id}" is listed twice`);
        seen.add(id);
        if (!files.includes(`${id}.md`)) err(deckPath, `order: "${id}" has no file ${id}.md`);
      }
      for (const file of files) {
        const id = file.slice(0, -3);
        if (!seen.has(id)) err(deckPath, `order: ${file} is not listed`);
      }
    }

    // --- unreferenced images are harmless but worth knowing about -------------------------
    const imagesDir = join(deckDir, "images");
    if (existsSync(imagesDir)) {
      for (const img of readdirSync(imagesDir)) {
        if (!img.startsWith(".") && !referencedImages.has(img)) {
          warnings.push(`${rel(join(imagesDir, img))}: not referenced by any question`);
        }
      }
    }

    decks.push({ name: deckName, questions: files.length });
  }

  return { errors, warnings, decks };
}

// --- CLI ---------------------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const dir = process.argv[2] ?? CONTENT_DIR;
  const { errors, warnings, decks } = validateContent(dir);
  for (const w of warnings) console.warn(`warning: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`error: ${e}`);
    console.error(`\n✗ content invalid: ${errors.length} error${errors.length === 1 ? "" : "s"}`);
    process.exit(1);
  }
  const summary = decks.map((d) => `${d.name} (${d.questions})`).join(", ");
  console.log(`✓ content valid: ${summary}`);
}
