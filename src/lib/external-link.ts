// Links that leave the site (AGENTS.md "External links"): a new tab, a small ↗ and a word for
// screen readers. Shared by the React component and the build-time markdown, so both match.

export const NEW_TAB = " (opens in a new tab)";

const ARROW_PATH = "M3.5 8.5 8.5 3.5M4.5 3.5h4v4";

/** The ↗ as markup, for HTML built outside React (explanations). */
export const externalIconHtml = `<svg class="ext" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${ARROW_PATH}"/></svg>`;

export const externalIconPath = ARROW_PATH;

/**
 * Split off the last word so it can sit in a no-wrap span with the arrow: the ↗ never ends up
 * alone on a line.
 */
export function splitLastWord(text: string): [string, string] {
  const i = text.trimEnd().lastIndexOf(" ");
  return [text.slice(0, i + 1), text.slice(i + 1)];
}
