// Build-time syntax highlighting with Shiki and our own theme (AGENTS.md "Colour").
// The theme paints each token kind with a placeholder colour that we turn into a class, so the
// real colours live in CSS variables and switch with the theme. Unstyled text stays plain.

import { createHighlighter, type BundledLanguage, type Highlighter, type ThemeRegistration } from "shiki";

const CLASS_BY_COLOR: Record<string, string> = {
  "#000001": "s-kw",
  "#000002": "s-str",
  "#000003": "s-num",
  "#000004": "s-fn",
  "#000005": "s-cm",
};
const [KW, STR, NUM, FN, CM] = Object.keys(CLASS_BY_COLOR);
const PLAIN = "#000000";

const theme: ThemeRegistration = {
  name: "canyoustill",
  type: "dark",
  colors: { "editor.foreground": PLAIN, "editor.background": "#ffffff" },
  tokenColors: [
    { settings: { foreground: PLAIN } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: CM } },
    {
      scope: [
        "keyword",
        "storage.type",
        "storage.modifier",
        "constant.language",
        "variable.language",
        "support.class",
        "support.constant",
        "punctuation.definition.template-expression",
        "entity.name.tag",
      ],
      settings: { foreground: KW },
    },
    // Operators and arrows read as punctuation, not keywords.
    { scope: ["keyword.operator", "storage.type.function.arrow"], settings: { foreground: PLAIN } },
    { scope: ["keyword.operator.new", "keyword.operator.expression"], settings: { foreground: KW } },
    { scope: ["string", "punctuation.definition.string", "string.regexp"], settings: { foreground: STR } },
    // Code inside ${…} is code again.
    { scope: ["meta.template.expression"], settings: { foreground: PLAIN } },
    { scope: ["constant.numeric", "entity.name.type", "entity.name.class"], settings: { foreground: NUM } },
    {
      scope: ["entity.name.function", "support.function", "entity.other.attribute-name"],
      settings: { foreground: FN },
    },
  ],
};

let highlighter: Promise<Highlighter> | undefined;
const getHighlighter = () => (highlighter ??= createHighlighter({ themes: [theme], langs: ["javascript", "html"] }));

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const LANG_ALIASES: Record<string, BundledLanguage> = { js: "javascript", javascript: "javascript", html: "html" };

/** Highlight code to newline-separated HTML with <span class="s-…"> tokens. */
export async function highlight(code: string, lang: string): Promise<string> {
  const language = LANG_ALIASES[lang];
  if (!language) return escapeHtml(code); // "text" and anything Shiki shouldn't touch
  const lines = (await getHighlighter()).codeToTokensBase(code, { lang: language, theme });
  return lines
    .map((tokens) => {
      let out = "";
      let open: string | null = null;
      for (const token of tokens) {
        const cls = CLASS_BY_COLOR[(token.color ?? PLAIN).toLowerCase()] ?? null;
        if (cls !== open) {
          if (open) out += "</span>";
          if (cls) out += `<span class="${cls}">`;
          open = cls;
        }
        out += escapeHtml(token.content);
      }
      return open ? `${out}</span>` : out;
    })
    .join("\n");
}
