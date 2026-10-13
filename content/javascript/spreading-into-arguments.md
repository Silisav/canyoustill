---
id: spreading-into-arguments
title: Which of the following options will return `6`?
answer: C
options:
  A: "`sumValues([...1, 2, 3])`"
  B: "`sumValues([...[1, 2, 3]])`"
  C: "`sumValues(...[1, 2, 3])`"
  D: "`sumValues([1, 2, 3])`"
source: upstream:lydiahallie#117
---

```javascript
function sumValues(x, y, z) {
  return x + y + z;
}
```

## Explanation

With the spread operator `...`, we can _spread_ iterables to individual elements. The `sumValues` function receives three arguments: `x`, `y` and `z`. `...[1, 2, 3]` will result in `1, 2, 3`, which we pass to the `sumValues` function.
