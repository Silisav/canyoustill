# Working on Can you still?

The guide for anyone changing this repo, people and coding agents alike. It says what the product
is, the rules that keep it what it is, and how each part works. [README.md](README.md) covers what
the project is and how to run it; [CONTRIBUTING.md](CONTRIBUTING.md) covers adding questions.

Read this file in full before any change. Code comments point into it by section name, for example
`(AGENTS.md "Motion")`.

**If something you need to decide isn't covered here, don't invent it.** Ask in an issue (or ask the
maintainer, if you're working with them), then record the answer in the right section of this file
in the same change.

---

## Product

You read a short piece of JavaScript, decide what it does, and then learn why: no run button, no
autocomplete, no AI in the loop. Coding agents write most of the code now and nobody has time to
review it all, so the skill of reading code fades from disuse. This is a few minutes of practice for
your memory and your mental model of the language.

**Who it's for.** Working developers who want to keep their mental model of JavaScript sharp.
Secondary: people preparing for interviews.

**Principles.**
1. Simple but perfect. One deck, one flow, done to a very high standard. Depth over breadth.
2. The game screen is sacred: nothing moves unless the player caused it. Playfulness lives on the
   home page.
3. Local-first: everything the app needs ships in the static build, and all player state lives on
   the device. No server the game can't live without. This is what keeps offline play, installing
   and a later native wrap possible.
4. Zero running cost. It's hosted on Vercel's free Hobby plan, which is non-commercial only: no ads,
   no sponsors.
5. Attribution is per question, not on a credits page.

### Out of scope

Not without a decision recorded here first:
- Accounts, login, cloud sync
- Scores, streaks, timers, leaderboards, XP, badges
- A translated interface or translated questions
- More than one deck in the interface (the data model supports several; the UI shows JavaScript)
- Spaced repetition
- Comments, discussion, or submitting questions through the site (questions come in by pull request)
- Ads, sponsors, newsletters, cookie banners
- Motion on page load, parallax, decorative animation
- Any dependency not listed in "Stack"

### Writing

Applies to the site's copy, page titles, share cards, docs and code comments.
- Direct, plain, a little dry. Talk to a peer.
- Never game language ("XP", "streak", "level up") and never corporate language ("empower",
  "journey", "seamless").
- **No em dashes (—).** Use a colon, a comma, a full stop, brackets or " · ". En dashes in number
  ranges (0–2) are fine.
- British spelling, as in the existing copy: colour, licence, behaviour.
- The headline is plain type. No coloured, highlighted or underlined words in headings: it's a stock
  template move.

---

## Commands

Node 22 (see `.nvmrc`).

| Command | What it does |
|---|---|
| `npm ci` | Install the exact dependency versions from `package-lock.json` |
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build (runs `validate` first) |
| `npm start` | Serve the production build |
| `npm run validate` | Check every question file; the build fails on any error |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright, phone and desktop). Build first: it serves the production build on port 3200 |
| `npm run typecheck` | TypeScript |
| `npm run import` | Seed a deck from Lydia Hallie's README (already done; see "Importer") |
| `npm run upstream:check` | Compare with upstream; CI runs it weekly |

First time on a machine: `npx playwright install chromium` for the browser tests.

Before you open a pull request: `npm run validate`, `npm test`, `npm run build`, `npm run test:e2e`.
CI runs the same on every push and pull request (`.github/workflows/ci.yml`).

---

## Repo layout

```
content/<deck>/           the questions: one markdown file each, deck.json, images/, LICENSE
scripts/                  importer, validator and their shared rules (scripts/lib/content.mjs)
src/app/                  pages and generated files (Next.js App Router)
  (site)/                 home, About, /play and /q/[slug]: one layout, so the header stays mounted
src/components/           UI; game/ is the game, home/ the home page, site/ the background
src/config/brand.ts       the product name, pitch and links: the only place the name is written
src/lib/                  state, the deck build, share images, install, theme
src/fonts/                self-hosted fonts and their licences
e2e/                      browser tests
tailwind.config.ts        the design tokens: colours, type sizes, radii, shadows, curves
```

Never edit generated output (`.next/`, the deck bundle served at `/decks/<deck>/deck.json`). Content
changes go in `content/`.

---

## Stack

Next.js (App Router, static) · TypeScript · Tailwind (as a token system; the config holds the
tokens) · Motion (`motion/mini`) · Shiki (build time, own theme) · marked (build time) · gray-matter +
zod · Serwist (service worker, via `@serwist/turbopack`, which needs esbuild) · idb-keyval ·
@vercel/og · @vercel/analytics · Vitest + Playwright.

**Do not add:** component libraries, icon packs (the few icons are drawn: `src/components/icons.tsx`),
state managers, CSS-in-JS, client-side syntax highlighting, analytics beyond "Analytics and
privacy", anything that sets a cookie.

A new dependency needs an issue first, saying why, and then a line in the list above.

---

## Content

Upstream: [lydiahallie/javascript-questions](https://github.com/lydiahallie/javascript-questions)
(MIT, Lydia Hallie). 155 English questions, each with a title, 0–2 code blocks, 2–5 lettered
options, one right answer and a markdown explanation. Four have no code (the title is the question);
some put several files in one question with `// file.js` comments; six explanations have diagrams.

### Question format

One file per question, `content/<deck>/<id>.md`:

````md
---
id: hoisting-var-vs-let          # the slug; the file name must match
title: What's the output?
answer: D
options:
  A: "`Lydia` and `undefined`"
  B: "`Lydia` and `ReferenceError`"
  C: "`ReferenceError` and `21`"
  D: "`undefined` and `ReferenceError`"
tags: [hoisting, scope]          # optional, editorial
difficulty: 2                    # optional, 1–3, editorial
source: upstream:lydiahallie#1   # or `community`
author: octocat                  # optional, community questions: a GitHub handle
---

```javascript
function sayHi() { ... }
```

## Explanation
Within the function, we first declare ...
````

`npm run validate` (and so the build) fails unless:
- `id` matches the file name and is unique across all decks
- there are 2–6 options with sequential letters, and `answer` is one of them
- the explanation isn't empty, and code blocks are fenced with a language
- `source` is `upstream:<name>#<number>` or `community`
- there's no raw HTML other than `<i>`, `<b>`, `<a>`, `<br>`
- images are local files under `content/<deck>/images/`
- `deck.json`'s `order` lists every question file exactly once

### Slugs and topics

A slug names the concept being tested and **never gives the answer away**. Once a question is
published its slug is frozen: it's the question's address (`/q/<slug>`).

Search titles and descriptions are led by a readable topic made from the slug
(`src/lib/deck/topic.ts`), because 108 of the 155 titles are "What's the output?". JavaScript names
keep their spelling ("setTimeout call order", "Number.isNaN vs isNaN"). Where the slug's words read
badly, a hand-written topic goes in `OVERRIDES` in that file, with a comment saying why. An override
must never give the answer away either, and the maintainer keeps track of them: say so in your pull
request when you add or change one.

### Importer

`scripts/import-upstream.mjs` turned upstream's README into these files once, downloading its images.
Titles are kept as upstream wrote them; tags and difficulty are never invented. A weekly GitHub
Action (`npm run upstream:check`) compares upstream with the commit pinned in `deck.json` and opens
or refreshes one issue when there's something to look at. It never changes content by itself, and
the site never reads upstream at runtime.

`npm run import -- --force` re-imports everything. It keeps slugs, tags and difficulty, but
overwrites local edits to upstream text and re-downloads the original images.

### Licence and attribution

Code: MIT ([LICENSE](LICENSE)). Questions: MIT, under upstream's notice
([content/javascript/LICENSE](content/javascript/LICENSE)). Every card shows "Question N · see the
original", linking to that question in Lydia Hallie's README; community questions show "Community
question by @handle". The home page and About credit Lydia Hallie by name.

---

## Design

### Type
- **Gabarito** for everything but code, self-hosted (400–900). Headlines are 900 with tracking
  −0.012em; tighter makes the letters touch. The home headline is fluid,
  `clamp(44px, 3vw + 33px, 88px)`, line height 0.95 (token `text-headline`).
- **IBM Plex Mono** for code, self-hosted (400/500/600 and italic 400).
- Body 17px / 1.5 on phones. Code 15px / 1.6 on phones, 16px on desktop. Code steps down by its
  longest line: over 44 characters 13.5px (15 desktop), over 58 characters 12.5px (14 desktop).
  Beyond that the code block scrolls sideways; the page never does.

### Colour
Two designed palettes, not one inverted: `palette` in `tailwind.config.ts`, exposed as `--c-*`
variables and Tailwind colours (`bg`, `fg`, `mute`, `line`, `edge`, `card`, `panel`, `yellow`, ...).
Use the tokens; never write a colour in a component.
- The system setting picks the palette; with no preference, light. The theme button overrides it and
  is remembered (`localStorage`), applied by a small inline script before the first paint, so a
  saved theme never flashes. Switching is one soft crossfade.
- Warm greys throughout. **No blue- or violet-tinted greys, no lilac:** both read as generated UI.
- `edge` (borders of things you press) is kept off boxes you can't press, so buttons stay distinct.
- Text contrast is at least 4.5:1, including every syntax colour on the code background (the
  Lighthouse audit counts code). Selected text is the brand yellow with `yellow-ink`.
- The Shiki syntax theme is our own (`src/lib/deck/highlight.ts`): keywords amber, strings green,
  numbers yellow, functions blue, comments muted italic, identifiers in the text colour.

### Components
Class strings for buttons are in `src/components/buttons.ts`.
- **Primary button**: yellow, 2px border and a hard 4px offset shadow in `shadow`, radius 14;
  pressed, it sinks 3px into its shadow. One per screen. Below 920px it spans its column (capped at
  560px on home); on desktop it keeps its natural width, never under 200px. Nothing is sticky
  except the game's bar.
- **Hover fill**: on devices that hover, the button's own colour a step darker (`yellow-hover`,
  `card-hover`) spreads across it from where the pointer comes in and drains toward where it leaves.
  The button itself doesn't move. Class `spread`; `src/components/HoverSpread.tsx` moves the start
  to the pointer. Instant under reduced motion.
- **Option button**: `card` fill, 2px `edge` border, a 3px `edge` ledge, radius 16, the letter in a
  36px chip. Pressed it moves down 3px; right and wrong take the ok and bad colours; the others dim
  to 40%. Options must read as buttons at a glance in both themes: test it.
- **Code block**: `bg2`, 2px border, radius 16; a file name row for multi-file questions. **Output
  line**: monospace on `bg2`, a `> ` prompt, the value in the text colour.
- **External links**: everything that leaves the site opens a new tab and ends in a small drawn ↗
  that nudges on hover; screen readers hear "(opens in a new tab)". The arrow stays on the line with
  the last word. Links inside explanations get the same at build time. Icon-only links (GitHub in
  the header) have no arrow and say it in their label. Links within the site never open a new tab.
- **Logo**: a cartoon brain from the side, pink with shading, an ink outline and a cream sticker rim,
  one drawing for both themes (`src/components/Logo.tsx`). App icons are the brain on the brand
  yellow; the favicon is the brain alone. Pressing it squashes it onto its stem and it springs back,
  on every page (`src/components/LogoLink.tsx`).
- **Wordmark**: logo and name stay on one line at every width. Below 360px both shrink a little
  (17px and 38px at 320px) so the name fits beside the header's buttons, GitHub included
  (`wordmark` in `src/components/site-type.ts`).
- **Cursor**: over things you can click, with a mouse, a cartoon glove in the logo's style, 32px,
  hotspot at the fingertip (`src/lib/cursor-image.tsx`). The arrow and text cursors stay the
  system's. Under forced colours or "more contrast" the system pointer comes back.
- **Share**: an icon button on the right of the game's bar, for the question on screen. With a mouse
  it copies the `/q/` link, its icon turning into a check with a flat "Link copied" note (not a
  toast). On touch screens it opens the system share sheet, or copies where there's none.
  `src/components/ShareButton.tsx`.
- **All questions sheet**: a grid of numbered cells coloured by result, the current one marked. The
  order is a switch, [In order | Shuffled], so a shuffle can be undone; either way the current
  question stays current. Then Reset progress. A bottom sheet on phones (drag to dismiss), a dialog
  on desktop. Icons lead their labels.
- **Icons**: drawn for the app, 24×24, stroked in `currentColor`. Each makes one small move on hover
  with a little overshoot (`ease-pop`, 300ms); none under reduced motion.

### Layout
- One breakpoint: phones and tablets below 920px, desktop from 920px (`desktop:`).
- The site frame is 1280px wide at most and at least a screen tall: on short pages the footer sits
  at the bottom of the window.
- Below 920px everything is one column. On desktop, home is two columns, **top-aligned** (never
  centred: a growing card would move the headline). The copy takes `minmax(0, 1fr)`, the card
  `clamp(400px, 42vw, 560px)`, with a `clamp(40px, 5vw, 80px)` gap; the card sits 16vh lower.
  About uses home's columns and type (`src/components/site-type.ts`).
- The game is one reading column, 720px at most, under the site's own header: a slim bar sticks to
  the top once the header scrolls away, with the counter centred (it opens All questions), share on
  the right and a 6px progress line beneath. It fits a 320px screen without sideways scrolling.
- Footer: the site's links on the left (About and privacy, Install the app where possible, GitHub
  and Add a question once the repo is set), the people on the right ("Questions by" the deck's `author`
  in `deck.json`, "Website by" `brand.maker`). On phones the credits drop below.
- Keyboard on desktop: 1–9 or A–F answer, Enter goes on, Esc closes sheets. Hints show only from
  920px.

### Home
The front door, not a landing page: headline, lead, one button ("Start", "Continue at N" or "Start
over"), the home card, a short stance ("Know what the code does.") and the credits. No testimonials,
no feature grids, no logos. Nothing blinks.

### The home card
A playable question that can't reflow the page, and never shows an explanation without its code.
1. Its height is fixed for its content. On a first visit it's question 1.
2. Answering marks the options in place, and a strip slides up inside the card's bottom edge: the
   output typed on one line, a verdict ("Most people miss this one." / "Nice. The rest get
   harder.") and one button, "See why" when wrong, "Start" when right. Nothing outside the card moves.
3. Both buttons **morph** the card into the game card for that question with a view transition:
   same code, same marks, the explanation unfolding beneath. No page load: the address changes
   inside the transition, so refresh and Back behave like the game. Without view transitions, a
   crossfade.
4. An answer here counts as the answer in the game, as does one given on a `/q/` page.
5. Returning players: once something is answered, the card shows the first unanswered question from
   your place, as "Up next", and "Continue at N" goes through it. With everything answered it's
   question 1 again and the button says "Start over". A copy of the up-next question is kept on the
   device and a `<head>` script hides the built-in card before first paint, so nothing flashes.
   Until something is answered, home says "Start", even after a `/q/` link was opened (that moves
   your place but answers nothing).
6. The card has no visible label; "Try one first" and "Up next" are its names for screen readers.
7. Every way in morphs through the card ("Start", "Continue at N", "Start over"), and they stay
   real links, so a modified click opens a new tab.
8. Back home from the game (the logo, or "Finish" on the last question), the card flies to its slot,
   turning into the question up next on the way, while the rest of home enters as after any page
   switch ("Motion"). The browser's own Back is a normal page switch.

### Game card
Title (or the question itself, when there's no code), code, options. After answering: the output
types out, the explanation unfolds, "Next question" arrives. Swipe left or Enter goes on. Cards
answered before come back answered, without animation. Verdicts: "Nice, that's right." / "Not
quite. It's D." / "You missed this one before" (only right or wrong is stored, not the letter). On
the last question the button says "Finish" and goes home. Diagrams are upstream's 2× exports, shown
at half their pixel size on a light backing (black ink on transparent).

### About
One screen in home's frame and type: what this is, where the questions come from, the licence, the
privacy note, and the repo links once they exist.

### Motion
One library (Motion's `animate` from `motion/mini`), a handful of moments, springs on anything
touched, nothing on page load.
- **Answer reveal**, one sequence with timings in `src/components/game/reveal.ts`: the other options
  dim (180ms), the output types (32ms a character, at most 1.1s, a tap skips), a 450ms pause, the
  explanation unfolds (450ms), Next arrives.
- **Card advance**: the outgoing card leaves and the next settles as one gesture.
- **Following a reveal**: as the explanation unfolds the page scrolls with it, just far enough to
  show Next, never pushing the output under the bar. On home, it scrolls just enough to show the
  strip, never hiding the option you tapped. Only after the player's own answer, never upward,
  stopped by the player's own scroll, touch or click; a jump under reduced motion.
  `src/components/game/follow.ts`.
- **Page switches** between home, About, `/q/` and into the game: the header (when on screen) and
  the background hold still while the old page and the new crossfade in 160ms. Then the new page
  enters in reading order, a step every 55ms from 140ms: headings and leads (`data-reveal`) rise
  line by line from behind an invisible edge (560ms), other blocks (`data-enter`) fade up 10px
  (520ms). Only what's on screen. Into the game, which has no headline, the whole page fades in and
  rises 12px. Back home from the game, the same reveal runs while the card flies; a block taking part
  in the flight is left out. Not on first load, not for the browser's Back. `src/components/PageLink.tsx`,
  `src/components/reveal-lines.ts`.
- **Sheet** follows the finger and dismisses by velocity. **Theme switch** is one crossfade; the new
  icon spins in.
- **Reduced motion**: everything instant; typing shows the whole value.

### Background
A faint texture behind home, About and `/q/`, mounted once in the site layout so it stays put across
page switches. The game stays plain. **Folds**: contour lines like a brain's folds in the `line`
colour (about 1.08:1 in light, 1.11:1 in dark), 1.3 CSS pixels wide on every screen, swelling
slightly under the pointer. Still on phones and under reduced motion; nothing without WebGL. Raw
WebGL2, no library, loaded once the page is idle. `src/components/site/paper.ts`.

### Easter eggs
One, for whoever opens the browser's console: an ASCII brain and a note
(`src/components/ConsoleNote.tsx`). No others are planned.

---

## Architecture

- Content is read at build time into one JSON bundle per deck, with every code block highlighted to
  HTML. The game fetches the bundle; nothing else is fetched at runtime.

### Routes
- `/` home, `/about`, `/play` and `/q/[slug]`.
- `/q/[slug]` is the game opened on that question, pre-rendered with the question in the page (for
  search, share cards and first paint). While you play the address follows the question on screen
  (replaced, not pushed: Back leaves the game), so the address bar is always a link to share.
  Opening one makes that question the current one; answers are untouched.
- `/play` resumes where you left off and switches the address to that question at once.
- Generated at build time: `/decks/<deck>/deck.json`, `/decks/<deck>/images/<file>`, `/icons/*`,
  `/cursors/*`, `/opengraph-image` and each question's, `/manifest.webmanifest`, `/sitemap.xml`,
  `/robots.txt`, the service worker at `/serwist/sw.js`.
- The 404 is server markup only: the JS budget test measures the framework's baseline on it.

### State
- Progress in IndexedDB (idb-keyval), one entry per deck: `{ order, results: { slug: boolean }, cur }`
  (`src/lib/progress.ts`, `progress-store.ts`). No user id.
- `localStorage` for small things that must be read before first paint or across visits: the theme,
  the up-next copy, install state.
- Moves between home and the game happen within one page so the card can morph
  (`src/lib/game-handoff.ts`).

### Offline and install
- The service worker (`src/sw.ts`, Serwist) precaches the shell, the pages, the deck bundle, fonts
  and images: after one visit the whole game works offline. A question address the browser hasn't
  kept is answered offline with the game's shell, which reads the question from the address.
- **Install offer**: the browser's automatic banner is suppressed. On a second visit, after at least
  five answers, a card of its own appears between two questions, once per visit
  (`src/components/game/InstallCard.tsx`): the app icon, "Install the app", three plain lines and
  [Install app] [Not now]. Install opens the browser's own dialog; "Not now" hides it for good;
  Enter or a swipe carries on. Plus "Install the app" in the footer whenever the browser can install
  it. Only where the browser offers an install API (Chromium); nothing on iPhones, where people can
  still use Share → Add to Home Screen. Installed, the app opens at `/`.

### Share images
Rendered at build time with @vercel/og from static copies of the fonts (`src/lib/share-image.tsx`):
a dark card with the logo and name. The site's card has the headline and lead. A question's card
says "Question N of 155", the title and the code in the syntax colours (at least 20px; long lines
clip, tall code ends in "…"); questions without code show their options.

### Search
Every page has its own title, description, canonical link and share card; `lang="en"`. Question
pages lead with the topic ("Slugs and topics"): title "setTimeout call order · JavaScript question
30 · Can you still?", description "JavaScript question 30 of 155: setTimeout call order. What's the
output? Use your brain, choose an answer, learn why." Home's description is its lead. `/play` and
the 404 are `noindex`; `/play` isn't in the sitemap. No structured data or keyword tags.

### Brand and name
The name, pitch and links are written once, in `src/config/brand.ts`, and everything reads them:
titles, the manifest, share cards, the header, About. Never write the name in copy or components.
- `url`: the site's address; canonical links and share images use it (until it's set, the Vercel
  deployment's own address).
- `repoUrl`: the GitHub repo. The GitHub button, "Add a question" and other repo links appear only
  when it's set, so no dead link ships.
- `maker`: credited in the footer.
- Home's `<title>` is just the headline, "Can you still read code?", since the name is in it.

### Budget and performance
- At most **50KB gzipped of our own JavaScript** on the game route, on top of the Next.js and React
  baseline (about 135KB, measured but not budgeted). `e2e/budget.e2e.ts` measures it against the
  404 page, which includes the root layout, so keep the root layout light: no Motion there.
- Lighthouse Performance and Accessibility at least 95 on mobile.

---

## Analytics and privacy

Cookieless only, no banner, honour Do Not Track and Global Privacy Control. Vercel Web Analytics
counts page views anonymously; it starts counting once enabled for the project in Vercel's
dashboard (`src/components/SiteAnalytics.tsx`, which drops the hit for DNT and GPC). No custom
events (they need a paid plan). About's privacy paragraph says exactly what's counted and what's
stored on the device: keep it true whenever this changes.

---

## Testing

- Unit tests (Vitest) sit beside the code: `*.test.ts`, and `scripts/*.test.mjs`.
- Browser tests (Playwright) in `e2e/`, in two projects: a 375×812 phone and a 1280×900 desktop. They
  run against the production build, so build first.
- Write tests that check what a person sees or does, and name them that way ("answering the sample
  changes nothing outside the card"). Keep them deterministic.

## Code conventions

- Match the code around you: its naming, its idioms, its comment density.
- Comments say why, briefly, and point to the section of this file that holds the rule.
- Use the tokens from `tailwind.config.ts`; new tokens go there.
- Content goes through `content/` and the validator; the name goes through `brand.ts`.
- Respect reduced motion in anything that moves.
