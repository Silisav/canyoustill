---
id: incrementing-imported-binding
title: What's the output?
answer: C
options:
  A: "`10`"
  B: "`11`"
  C: "`Error`"
  D: "`NaN`"
source: upstream:lydiahallie#57
---

```javascript
// counter.js
let counter = 10;
export default counter;
```

```javascript
// index.js
import myCounter from './counter';

myCounter += 1;

console.log(myCounter);
```

## Explanation

An imported module is _read-only_: you cannot modify the imported module. Only the module that exports them can change its value.

When we try to increment the value of `myCounter`, it throws an error: `myCounter` is read-only and cannot be modified.
