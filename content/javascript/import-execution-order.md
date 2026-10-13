---
id: import-execution-order
title: What's the output?
answer: B
options:
  A: "`running index.js`, `running sum.js`, `3`"
  B: "`running sum.js`, `running index.js`, `3`"
  C: "`running sum.js`, `3`, `running index.js`"
  D: "`running index.js`, `undefined`, `running sum.js`"
source: upstream:lydiahallie#67
---

```javascript
// index.js
console.log('running index.js');
import { sum } from './sum.js';
console.log(sum(1, 2));

// sum.js
console.log('running sum.js');
export const sum = (a, b) => a + b;
```

## Explanation

With the `import` keyword, all imported modules are _pre-parsed_. This means that the imported modules get run _first_, and the code in the file that imports the module gets executed _after_.

This is a difference between `require()` in CommonJS and `import`! With `require()`, you can load dependencies on demand while the code is being run. If we had used `require` instead of `import`, `running index.js`, `running sum.js`, `3` would have been logged to the console.
