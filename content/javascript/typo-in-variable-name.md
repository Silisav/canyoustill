---
id: typo-in-variable-name
title: What's the output?
answer: A
options:
  A: "`{}`"
  B: "`ReferenceError: greetign is not defined`"
  C: "`undefined`"
source: upstream:lydiahallie#9
---

```javascript
let greeting;
greetign = {}; // Typo!
console.log(greetign);
```

## Explanation

It logs the object, because we just created an empty object on the global object! When we mistyped `greeting` as `greetign`, the JS interpreter actually saw this as:

1. `global.greetign = {}` in Node.js
2. `window.greetign = {}`, `frames.greetign = {}` and `self.greetign` in browsers.
3. `self.greetign` in web workers.
4. `globalThis.greetign` in all environments.

In order to avoid this, we can use `"use strict"`. This makes sure that you have declared a variable before setting it equal to anything.
