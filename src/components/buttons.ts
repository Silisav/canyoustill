// Button styles shared across screens (AGENTS.md "Components"). Class strings rather than
// components so they work on <button>, <a> and Next's <Link> alike. Hover is the `spread` fill
// (globals.css): the colour spreads, the button stays put.

const press = "transition-[translate,box-shadow,border-color] duration-75 ease-out";

/** Yellow, hard offset shadow; pressed sinks 3px into its shadow. One per screen. At least 200px on desktop, so "Play" isn't a stub. */
export const primaryButton =
  `spread [--spread:var(--c-yellow-hover)] desktop:min-w-[200px] inline-flex items-center justify-center gap-2.5 rounded-primary border border-shadow bg-yellow px-6 py-4 font-bold text-yellow-ink shadow-primary ${press} ` +
  "active:translate-x-[3px] active:translate-y-[3px] active:shadow-primary-pressed";

/** The primary spans its column on phones and tablets; on desktop its natural width, at least 200px (in primaryButton). */
export const phoneWide = "w-full desktop:w-auto";

/** Quiet secondary action: card fill, edge border, no shadow. */
export const ghostButton =
  `spread group inline-flex items-center justify-center gap-2 rounded-primary border border-edge bg-card px-3.5 py-2.5 text-[15px] font-semibold ${press} ` +
  "hover:border-mute";

/** 42px square icon button for the top bar. */
export const iconButton =
  `spread group inline-grid size-[42px] place-items-center rounded-[12px] border border-edge bg-card text-mute ${press} ` +
  "hover:border-mute hover:text-fg";

/**
 * An icon's small move when its button is hovered (AGENTS.md "Motion"); add the move itself,
 * e.g. `group-hover:rotate-90`. Hover only; none under reduced motion.
 */
export const iconMotion = "transition-transform duration-300 ease-pop";
