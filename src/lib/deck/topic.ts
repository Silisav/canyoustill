// What a question is about, in words, from its slug (AGENTS.md "Content": slugs name the concept being
// tested and never give the answer away). For page titles and descriptions: 108 questions share
// the title "What's the output?", so the title alone makes 155 near-identical search results.

/** Slug words (or runs of them) that are JavaScript names, written as JavaScript writes them. */
const NAMES = new Map(
  Object.entries({
    "intl-number-format": "Intl.NumberFormat",
    "number-isnan": "Number.isNaN",
    "object-assign": "Object.assign",
    "object-entries": "Object.entries",
    "object-freeze": "Object.freeze",
    "object-seal": "Object.seal",
    "promise-all": "Promise.all",
    "promise-race": "Promise.race",
    "promise-resolve": "Promise.resolve",
    "json-parse": "JSON.parse",
    "json-stringify": "JSON.stringify",
    "string-raw": "String.raw",
    "set-has": "Set.has",
    "for-in": "for...in",
    "for-of": "for...of",
    "for-await": "for await",
    "yield-star": "yield*",
    defineproperty: "defineProperty",
    foreach: "forEach",
    hasownproperty: "hasOwnProperty",
    iife: "IIFE",
    indexof: "indexOf",
    isnan: "isNaN",
    javascript: "JavaScript",
    padstart: "padStart",
    parseint: "parseInt",
    sessionstorage: "sessionStorage",
    setinterval: "setInterval",
    settimeout: "setTimeout",
    this: "this",
    typeof: "typeof",
  }),
); // a Map, not an object: "constructor" is a slug word too

/**
 * Hand-written topics where the slug's words read badly (AGENTS.md "Search" lists them too; keep
 * the two in step). Like slugs, a topic must never give the answer away.
 */
export const OVERRIDES: Record<string, { title: string; inSentence: string }> = {
  // The slug of a question without code: it reads unfinished.
  "everything-in-javascript-is": { title: "Kinds of values in JavaScript", inSentence: "kinds of values in JavaScript" },
  // "not" is the ! operator, but reads as English.
  "not-typeof-precedence": { title: "!typeof precedence", inSentence: "!typeof precedence" },
  "not-typeof-after-reassignment": { title: "!typeof after reassignment", inSentence: "!typeof after reassignment" },
};

/** "hoisting-var-vs-let" → "Hoisting var vs let" (title) and "hoisting var vs let" (mid-sentence). */
export function topic(slug: string): { title: string; inSentence: string } {
  if (Object.hasOwn(OVERRIDES, slug)) return OVERRIDES[slug];
  const parts = slug.split("-");
  const words: string[] = [];
  let startsWithName = false;
  for (let i = 0; i < parts.length; ) {
    const run = [3, 2, 1].find((n) => NAMES.has(parts.slice(i, i + n).join("-")));
    if (i === 0) startsWithName = run !== undefined;
    if (run) words.push(NAMES.get(parts.slice(i, i + run).join("-"))!);
    else words.push(parts[i]);
    i += run ?? 1;
  }
  const inSentence = words.join(" ");
  // A name keeps its own case at the start too: "setTimeout call order", not "SetTimeout…".
  const title = startsWithName ? inSentence : inSentence[0].toUpperCase() + inSentence.slice(1);
  return { title, inSentence };
}
