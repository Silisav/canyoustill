---
id: unary-plus-and-not
title: What's the output?
answer: A
options:
  A: "`1` and `false`"
  B: "`false` and `NaN`"
  C: "`false` and `false`"
source: upstream:lydiahallie#4
---

```javascript
+true;
!'Lydia';
```

## Explanation

The unary plus tries to convert an operand to a number. `true` is `1`, and `false` is `0`.

The string `'Lydia'` is a truthy value. What we're actually asking, is "Is this truthy value falsy?". This returns `false`.
