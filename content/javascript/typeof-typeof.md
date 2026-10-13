---
id: typeof-typeof
title: What's the output?
answer: B
options:
  A: '`"number"`'
  B: '`"string"`'
  C: '`"object"`'
  D: '`"undefined"`'
source: upstream:lydiahallie#36
---

```javascript
console.log(typeof typeof 1);
```

## Explanation

`typeof 1` returns `"number"`.
`typeof "number"` returns `"string"`
