# Can you still?

Can you still read code? 155 JavaScript questions that look easy and aren't. Use your brain,
choose an answer, learn why.

Coding agents write most of the code now, faster than anyone can review it, so we write less, read
less, and slowly forget what we used to know. This is a few minutes of practice without them: read
a few lines of JavaScript, choose what they do, then find out why.

- Works on phones and desktops, in light and dark.
- Installs as an app and works offline: every question and explanation is saved on your device.
- No account, no cookies, no tracking beyond anonymous page counts.

## The questions

The questions and explanations are [Lydia Hallie's javascript-questions](https://github.com/lydiahallie/javascript-questions),
used under the MIT licence. Every card links to its original.

Want to add a question or fix one? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Run it locally

You need Node 22 (there's an `.nvmrc`).

```bash
npm ci
npm run dev
```

Then open http://localhost:3000. Other commands:

```bash
npm run build                    # production build (checks every question first)
npm start                        # serve the production build
npm test                         # unit tests
npx playwright install chromium  # once, for the browser tests
npm run test:e2e                 # browser tests, against the production build
```

## How it's built

Next.js (static), TypeScript and Tailwind. Questions are markdown files in `content/`, turned into
one JSON bundle at build time with the code already highlighted. Progress stays on your device, in
IndexedDB. A service worker keeps the whole game available offline. Hosted on Vercel.

Everything about how it works, and the rules for changing it, is in [AGENTS.md](AGENTS.md). It's
written for people and coding agents alike.

## Licence

The code is MIT, see [LICENSE](LICENSE). The questions are MIT under their original notice, see
[content/javascript/LICENSE](content/javascript/LICENSE).

Website by [Vasilis Tsirimokos](https://www.linkedin.com/in/vtsirimokos/).
