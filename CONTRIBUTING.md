# Contributing

Thanks for helping. Most contributions are questions: adding one, or fixing one. Both are a pull
request that changes a markdown file; there's no admin page and no database. The pull request is
the editorial process.

Before changing code, read [AGENTS.md](AGENTS.md). It holds the rules and how everything works, for
people and coding agents alike. For anything bigger than a fix, open an issue first, so we can agree
on it before you spend time on it.

## Add a question

1. Pick a slug. It names what the question tests, in lowercase words with hyphens, and **never gives
   the answer away**: `default-sort-order`, not `sort-compares-strings`. It becomes the question's
   address, `/q/<slug>`, and can't change once published.
2. Create `content/javascript/<slug>.md` from the template below.
3. Add the slug to the end of `order` in `content/javascript/deck.json`.
4. Check it: `npm run validate`, then `npm run dev` and open `http://localhost:3000/q/<slug>`.
5. Open a pull request. CI checks every question and runs the tests, and the pull request gets a
   preview link where you can try it.

Template:

````md
---
id: default-sort-order
title: What's the output?
answer: C
options:
  A: "`[1, 3, 10]`"
  B: "`[10, 1, 3]`"
  C: "`[1, 10, 3]`"
  D: "`TypeError`"
tags: [arrays, sort]
source: community
author: your-github-handle
---

```javascript
console.log([10, 1, 3].sort());
```

## Explanation

Explain why the right answer is right, and why each wrong one is tempting: that's where people
learn the most.
````

What makes a good question:
- **It looks easy and isn't.** One idea, tested in a few lines that fit on a phone (about 45
  characters wide reads best; 80 at most).
- **The wrong answers are plausible.** Each one is what someone with a slightly wrong mental model
  would choose.
- **One answer is right**, in any current browser and Node.
- **The explanation teaches.** Plain English, short paragraphs, inline code for names and values.

The rules the validator enforces:
- `id` matches the file name and is unique.
- 2–6 options with letters in order (A, B, C, ...), and `answer` is one of them.
- Code blocks are fenced with a language (`javascript`), and the explanation isn't empty.
- No HTML other than `<i>`, `<b>`, `<a>` and `<br>`.
- Images are files in `content/javascript/images/`, named `<slug>-1.png` and so on, and written
  `![What the diagram shows](images/<slug>-1.png)`.
- `source` is `community` for new questions; `author` (optional) is your GitHub handle, shown on the
  card as "Community question by @handle".
- `tags` and `difficulty` (1–3) are optional.

English only.

## Fix a question

Edit its file in `content/javascript/` and open a pull request saying what was wrong.

Most questions come from [Lydia Hallie's javascript-questions](https://github.com/lydiahallie/javascript-questions).
If the mistake is in the original too, consider fixing it there as well, so everyone benefits.

## Writing

The site's voice is direct, plain and a little dry. No game language (XP, streaks, levels), no
corporate language, no em dashes. British spelling (colour, licence). More in
[AGENTS.md](AGENTS.md#writing).

## Licence

By contributing you agree that your contribution is licensed under the MIT licence
([LICENSE](LICENSE)).
