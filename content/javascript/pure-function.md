---
id: pure-function
title: Is this a pure function?
answer: A
options:
  A: "Yes"
  B: "No"
source: upstream:lydiahallie#77
---

```javascript
function sum(a, b) {
  return a + b;
}
```

## Explanation

A pure function is a function that _always_ returns the same result, if the same arguments are passed.

The `sum` function always returns the same result. If we pass `1` and `2`, it will _always_ return `3` without side effects. If we pass `5` and `10`, it will _always_ return `15`, and so on. This is the definition of a pure function.
