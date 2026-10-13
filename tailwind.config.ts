// Design tokens, the one source for colours, type sizes, radii, shadows and curves (AGENTS.md
// "Design"). Components use these; new tokens go here.
// Loaded from src/app/globals.css via `@config`.

import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/** The two designed palettes (AGENTS.md "Colour"). The system preference picks; light without one. */
export const palette = {
  dark: {
    bg: "#1A1A18",
    bg2: "#222220",
    card: "#2E2E2A",
    panel: "#242422", // a raised surface between bg and card: the home card (code sits in it as a darker well)
    line: "#3B3B36", // structure: code blocks, panels, dividers
    edge: "#67665E", // things you press: option buttons and their letter chips (3:1 on bg)
    fg: "#F4F2EC",
    mute: "#9C9A90",
    yellow: "#F6C644",
    "yellow-ink": "#1A1400",
    // Hover fills that spread across buttons: each a step darker than the button's own colour.
    // yellow-ink stays 9.4:1 on yellow-hover; mute stays ≥4.5:1 on card-hover.
    "yellow-hover": "#E9B127",
    "card-hover": "#272724",
    shadow: "#8A6A12", // deep amber: near-black vanished on bg (1.1:1)
    ok: "#5BD0A0",
    okbg: "#1B3A2E",
    bad: "#FF8484",
    badbg: "#3D2222",
    scrim: "#0000008C", // 55% black behind sheets and dialogs
    // Logo art: the same in both themes (a logo doesn't change colour with the page).
    "logo-pink": "#F8A9C5",
    "logo-shade": "#EB7AA1",
    "logo-hi": "#FFDCE8",
    "logo-ink": "#1A1A18",
    "logo-rim": "#F4F2EC",
    "ok-ink": "#06251A", // letter on a correct option's chip
    "bad-ink": "#2B0B10", // letter on a wrong option's chip
    // Syntax: each ≥4.5:1 on bg2 (Lighthouse audits code contrast too).
    "syn-kw": "#F0A66B",
    "syn-str": "#9FD98B",
    "syn-num": "#F6C644",
    "syn-fn": "#8BC7F0",
    "syn-cm": "#8B8A84",
  },
  light: {
    bg: "#F4F2EC",
    bg2: "#ECE9E1",
    card: "#FFFFFF",
    panel: "#F9F8F4",
    line: "#C9C4B4",
    edge: "#C9C4B4",
    fg: "#1A1A22",
    mute: "#6F6E7C",
    yellow: "#F6C644",
    "yellow-ink": "#1A1400",
    "yellow-hover": "#E9B127",
    "card-hover": "#F7F5F0",
    shadow: "#1A1A22",
    ok: "#1E9E6A",
    okbg: "#DDF4EA",
    bad: "#D6454F",
    badbg: "#FBE3E6",
    scrim: "#0000008C",
    "logo-pink": "#F8A9C5",
    "logo-shade": "#EB7AA1",
    "logo-hi": "#FFDCE8",
    "logo-ink": "#1A1A18",
    "logo-rim": "#F4F2EC",
    "ok-ink": "#06251A",
    "bad-ink": "#2B0B10",
    "syn-kw": "#9B5619",
    "syn-str": "#1A7735",
    "syn-num": "#8A6000",
    "syn-fn": "#0D6AB6",
    "syn-cm": "#6A685F",
  },
} as const;

type Token = keyof typeof palette.dark;
const tokens = Object.keys(palette.dark) as Token[];
const cssVars = (p: Record<Token, string>) => Object.fromEntries(tokens.map((t) => [`--c-${t}`, p[t]]));

export default {
  theme: {
    // One breakpoint: mobile below, desktop at and above (AGENTS.md "Layout").
    screens: { desktop: "920px" },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      ...Object.fromEntries(tokens.map((t) => [t, `var(--c-${t})`])),
    },
    fontFamily: {
      sans: ["var(--font-gabarito)", "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
    extend: {
      fontSize: {
        base: ["17px", { lineHeight: "1.5" }],
        // The home headline: fluid from phones to wide screens (44px at 375, ~71px at 1280, 88px max).
        headline: ["clamp(44px, 3vw + 33px, 88px)", { lineHeight: "0.95" }],
        // Code steps down by longest line: >44 chars "long", >58 chars "longer"; beyond that
        // the block scrolls horizontally. Desktop sizes are one step up.
        code: ["15px", { lineHeight: "1.6" }],
        "code-desktop": ["16px", { lineHeight: "1.6" }],
        "code-long": ["13.5px", { lineHeight: "1.6" }],
        "code-long-desktop": ["15px", { lineHeight: "1.6" }],
        "code-longer": ["12.5px", { lineHeight: "1.6" }],
        "code-longer-desktop": ["14px", { lineHeight: "1.6" }],
      },
      letterSpacing: {
        // Headline tracking. Do not go tighter: the letters touch.
        headline: "-0.012em",
      },
      borderWidth: { DEFAULT: "2px" },
      borderRadius: {
        primary: "14px", // primary button
        card: "16px", // option buttons, code blocks, panels
      },
      boxShadow: {
        primary: "4px 4px 0 var(--c-shadow)",
        "primary-pressed": "1px 1px 0 var(--c-shadow)",
        option: "0 3px 0 var(--c-edge)",
      },
      maxWidth: {
        column: "720px", // desktop reading column for the game
      },
      transitionTimingFunction: {
        // A little overshoot, for the icons' small hover moves.
        pop: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      // Light by default, dark when the system asks for it, and an explicit data-theme (the
      // toggle) beats both. Order matters: [data-theme='dark'] must come after :root.
      addBase({
        ":root, [data-theme='light']": { ...cssVars(palette.light), colorScheme: "light" },
        "@media (prefers-color-scheme: dark)": {
          ":root:not([data-theme='light'])": { ...cssVars(palette.dark), colorScheme: "dark" },
        },
        "[data-theme='dark']": { ...cssVars(palette.dark), colorScheme: "dark" },
      });
    }),
  ],
} satisfies Config;
