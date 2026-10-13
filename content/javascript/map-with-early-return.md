---
id: map-with-early-return
title: What's the output?
answer: C
options:
  A: "`[]`"
  B: "`[null, null, null]`"
  C: "`[undefined, undefined, undefined]`"
  D: "`[ 3 x empty ]`"
source: upstream:lydiahallie#50
---

```javascript
[1, 2, 3].map(num => {
  if (typeof num === 'number') return;
  return num * 2;
});
```

## Explanation

When mapping over the array, the value of `num` is equal to the element it’s currently looping over. In this case, the elements are numbers, so the condition of the if statement `typeof num === "number"` returns `true`. The map function creates a new array and inserts the values returned from the function.

However, we don’t return a value. When we don’t return a value from the function, the function returns `undefined`. For every element in the array, the function block gets called, so for each element we return `undefined`.
