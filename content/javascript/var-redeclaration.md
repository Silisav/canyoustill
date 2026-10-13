---
id: var-redeclaration
title: What's the output?
answer: B
options:
  A: "`8`"
  B: "`10`"
  C: "`SyntaxError`"
  D: "`ReferenceError`"
source: upstream:lydiahallie#23
---

```javascript
var num = 8;
var num = 10;

console.log(num);
```

## Explanation

With the `var` keyword, you can declare multiple variables with the same name. The variable will then hold the latest value.

You cannot do this with `let` or `const` since they're block-scoped and therefore can't be redeclared.
