---
id: array-flat
title: What's the output?
answer: B
options:
  A: "`['🥑', ['✨', '✨', ['🍕', '🍕']]]`"
  B: "`['🥑', '✨', '✨', ['🍕', '🍕']]`"
  C: "`['🥑', ['✨', '✨', '🍕', '🍕']]`"
  D: "`['🥑', '✨', '✨', '🍕', '🍕']`"
source: upstream:lydiahallie#131
---

```javascript
const emojis = ['🥑', ['✨', '✨', ['🍕', '🍕']]];

console.log(emojis.flat(1));
```

## Explanation

With the `flat` method, we can create a new, flattened array. The depth of the flattened array depends on the value that we pass. In this case, we passed the value `1` (which we didn't have to, that's the default value), meaning that only the arrays on the first depth will be concatenated. `['🥑']` and `['✨', '✨', ['🍕', '🍕']]` in this case. Concatenating these two arrays results in `['🥑', '✨', '✨', ['🍕', '🍕']]`.
