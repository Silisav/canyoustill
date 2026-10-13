---
id: assignment-inside-index
title: What's the output?
answer: B
options:
  A: "`🤠`"
  B: "`🥰`"
  C: "`SyntaxError`"
  D: "`ReferenceError`"
source: upstream:lydiahallie#118
---

```javascript
let num = 1;
const list = ['🥳', '🤠', '🥰', '🤪'];

console.log(list[(num += 1)]);
```

## Explanation

With the `+=` operator, we're incrementing the value of `num` by `1`. `num` had the initial value `1`, so `1 + 1` is `2`. The item on the second index in the `list` array is 🥰, `console.log(list[2])` prints 🥰.
