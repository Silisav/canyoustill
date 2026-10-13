---
id: expressions-in-array-literal
title: What is the output?
answer: C
options:
  A: '`["1 + 2", "1 * 2", "1 / 2"]`'
  B: '`["12", 2, 0.5]`'
  C: "`[3, 2, 0.5]`"
  D: "`[1, 1, 1]`"
source: upstream:lydiahallie#80
---

```javascript
const list = [1 + 2, 1 * 2, 1 / 2];
console.log(list);
```

## Explanation

Array elements can hold any value. Numbers, strings, objects, other arrays, null, boolean values, undefined, and other expressions such as dates, functions, and calculations.

The element will be equal to the returned value. `1 + 2` returns `3`, `1 * 2` returns `2`, and `1 / 2` returns `0.5`.
