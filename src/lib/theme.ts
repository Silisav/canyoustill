// Theme choice (AGENTS.md "Colour"): the system decides, light without a preference, and an explicit
// choice from the toggle wins. The choice lives in localStorage so the inline script below can
// apply it before first paint.

export type Theme = "light" | "dark";

const KEY = "theme";

/** Repaint the browser chrome (<meta name="theme-color">) to the page colour now in effect. */
function syncChrome() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--c-bg").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
}

/**
 * Inlined in <head>; runs before paint. Keep it tiny and free of imports. A saved choice also
 * repaints the browser chrome once the meta tags exist (syncChrome is self-contained, so its
 * source can be inlined as is).
 */
export const themeScript = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;addEventListener("DOMContentLoaded",${syncChrome.toString()})}}catch(e){}`;

export function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply and remember a theme, as one crossfade where the browser supports View Transitions. */
export function setTheme(theme: Theme) {
  const apply = () => {
    document.documentElement.dataset.theme = theme;
    syncChrome();
  };
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private mode or storage disabled: the choice lasts for this page only.
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && document.startViewTransition) document.startViewTransition(apply);
  else apply();
}
