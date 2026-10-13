---
id: array-methods-that-mutate
title: Which of these methods modifies the original array?
answer: D
options:
  A: "`All of them`"
  B: "`map` `reduce` `slice` `splice`"
  C: "`map` `slice` `splice`"
  D: "`splice`"
source: upstream:lydiahallie#108
---

```javascript
const emojis = ['✨', '🥑', '😍'];

emojis.map(x => x + '✨');
emojis.filter(x => x !== '🥑');
emojis.find(x => x !== '🥑');
emojis.reduce((acc, cur) => acc + '✨');
emojis.slice(1, 2, '✨');
emojis.splice(1, 2, '✨');
```

## Explanation

With `splice` method, we modify the original array by deleting, replacing or adding elements. In this case, we removed 2 items from index 1 (we removed `'🥑'` and `'😍'`) and added the ✨ emoji instead.

`map`, `filter` and `slice` return a new array, `find` returns an element, and `reduce` returns a reduced value.
