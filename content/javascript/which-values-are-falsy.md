---
id: which-values-are-falsy
title: Which of these values are falsy?
answer: A
options:
  A: "`0`, `''`, `undefined`"
  B: "`0`, `new Number(0)`, `''`, `new Boolean(false)`, `undefined`"
  C: "`0`, `''`, `new Boolean(false)`, `undefined`"
  D: "All of them are falsy"
source: upstream:lydiahallie#35
---

```javascript
0;
new Number(0);
('');
(' ');
new Boolean(false);
undefined;
```

## Explanation

There are 8 falsy values:

- `undefined`
- `null`
- `NaN`
- `false`
- `''` (empty string)
- `0`
- `-0`
- `0n` (BigInt(0))

Function constructors, like `new Number` and `new Boolean` are truthy.
