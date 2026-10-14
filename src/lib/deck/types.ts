// The per-deck bundle (AGENTS.md "Architecture"): built from content/<deck>/ at build time,
// served as /decks/<deck>/deck.json, read by the game. All HTML is pre-rendered and comes only
// from validated content.

export type CodeSize = "base" | "long" | "longer";

export interface CodeBlock {
  /** File name for multi-file questions (from a leading `// name.js` line), else null. */
  file: string | null;
  /** Highlighted code: text with <span class="s-…"> tokens, newline-separated. */
  html: string;
  /** Font step from the longest line: >44 chars "long", >58 "longer" (AGENTS.md "Type"). */
  size: CodeSize;
}

export interface Option {
  key: string;
  html: string;
}

export interface Question {
  id: string;
  /** Upstream question number, or null for community questions. */
  number: number | null;
  /** The question in Lydia Hallie's README, or null for community questions. Not shown on the card
   * (2026-10-14); the weekly upstream check still verifies it. */
  sourceUrl: string | null;
  author: string | null;
  titleHtml: string;
  code: CodeBlock[];
  options: Option[];
  answer: string;
  /** The correct option as plain text, typed into the output line. */
  output: string;
  explanationHtml: string;
}

export interface Deck {
  id: string;
  name: string;
  /** Where the questions come from, for credits; null for a deck written here. */
  upstreamUrl: string | null;
  /** Who wrote the questions, credited by name with a link to them; null if there's no one to credit. */
  author: { name: string; url: string } | null;
  /** Content hash of the questions: lets the client tell a stale copy from a current one. */
  version: string;
  questions: Question[];
}
