---
id: await-with-try-finally
title: What's the output?
answer: C
options:
  A: "`Woah some cool data`"
  B: "`Oh finally!`"
  C: "`Woah some cool data` `Oh finally!`"
  D: "`Oops didn't work` `Oh finally!`"
source: upstream:lydiahallie#130
---

```javascript
const myPromise = Promise.resolve('Woah some cool data');

(async () => {
  try {
    console.log(await myPromise);
  } catch {
    throw new Error(`Oops didn't work`);
  } finally {
    console.log('Oh finally!');
  }
})();
```

## Explanation

In the `try` block, we're logging the awaited value of the `myPromise` variable: `"Woah some cool data"`. Since no errors were thrown in the `try` block, the code in the `catch` block doesn't run. The code in the `finally` block _always_ runs, `"Oh finally!"` gets logged.
