// Page switch, part two (AGENTS.md "Motion"): the new page enters as one sequence in reading
// order, so nothing is already sitting there while the rest arrives. Headings and the lead
// (`data-reveal`) rise line by line from behind an invisible edge at each line's foot; other
// blocks (`data-enter`: buttons, the card, paragraphs) fade up a little. Only what's on screen;
// the rest is just there. Words carry the line mask (globals.css `.reveal-word`) and every word on
// a line shares its delay, so lines move as one. Afterwards the original text nodes go back and
// the marks come off, so React's DOM, selection and resizing are untouched.

/** The first step waits for the old page to have faded; then a step every STEP_MS. */
const START_MS = 140;
const STEP_MS = 55;
const LINE_MS = 560;
const BLOCK_MS = 520;

export function enterPage(root: ParentNode = document) {
  const restore: (() => void)[] = [];
  const steps: HTMLElement[][] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-reveal], [data-enter]")) {
    if (el.getBoundingClientRect().top >= innerHeight) continue; // below the fold: just there
    if (el.parentElement?.closest("[data-enter]")) continue; // inside an entering block: moves with it
    if (el.querySelector('[style*="view-transition-name"]')) continue; // the card flying in (morph.ts) moves on its own
    if (el.hasAttribute("data-reveal")) {
      steps.push(...lines(splitWords(el, restore)));
    } else {
      el.dataset.entering = "";
      steps.push([el]);
      restore.push(() => {
        delete el.dataset.entering;
        el.style.removeProperty("animation-delay");
      });
    }
  }
  if (!steps.length) return;
  steps.forEach((step, i) => step.forEach((el) => (el.style.animationDelay = `${START_MS + i * STEP_MS}ms`)));
  setTimeout(() => restore.forEach((r) => r()), START_MS + steps.length * STEP_MS + Math.max(LINE_MS, BLOCK_MS) + 50);
}

/** Words grouped into the lines they sit on. */
function lines(words: HTMLElement[]): HTMLElement[][] {
  const out: HTMLElement[][] = [];
  let top = Number.NaN;
  for (const word of words) {
    const t = word.getBoundingClientRect().top;
    if (!(Math.abs(t - top) < 4)) {
      out.push([]);
      top = t;
    }
    out[out.length - 1].push(word);
  }
  return out;
}

/** Wrap each word of `el` in a `.reveal-word` box; `restore` puts the original text nodes back. */
function splitWords(el: HTMLElement, restore: (() => void)[]): HTMLElement[] {
  const words: HTMLElement[] = [];
  let last: HTMLElement | null = null; // the word box the previous piece ended in, if no space followed
  for (const text of textNodes(el)) {
    if (!text.data.trim()) {
      last = null; // a space on its own still ends the word before it
      continue;
    }
    const parts = text.data.split(/(\s+)/).filter(Boolean);
    // A word split across elements ("<b>aren't</b>.") stays one box: two boxes side by side may
    // wrap apart where the plain text can't. The continuation joins the previous box, in its own
    // weight and colour, so it looks exactly as before.
    const anchor = document.createTextNode("");
    const nodes: ChildNode[] = [anchor];
    if (last && !/^\s/.test(text.data)) {
      const piece = document.createElement("span");
      const look = getComputedStyle(text.parentElement ?? el);
      Object.assign(piece.style, { fontWeight: look.fontWeight, fontStyle: look.fontStyle, color: look.color });
      piece.textContent = parts.shift() ?? "";
      last.append(piece);
    }
    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        nodes.push(document.createTextNode(part));
        continue;
      }
      const word = document.createElement("span");
      word.className = "reveal-word";
      word.textContent = part;
      words.push(word);
      nodes.push(word);
    }
    const tail = nodes.at(-1);
    last = /\s$/.test(text.data) ? null : tail instanceof HTMLElement ? tail : last;
    text.replaceWith(...nodes);
    restore.push(() => {
      anchor.before(text);
      nodes.forEach((n) => n.remove());
    });
  }
  return words;
}

function textNodes(el: Element): Text[] {
  const out: Text[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) out.push(walk.currentNode as Text);
  return out;
}
