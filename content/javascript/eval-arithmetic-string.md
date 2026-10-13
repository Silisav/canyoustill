---
id: eval-arithmetic-string
title: What's the value of `sum`?
answer: A
options:
  A: "`105`"
  B: '`"105"`'
  C: "`TypeError`"
  D: '`"10*10+5"`'
source: upstream:lydiahallie#21
---

```javascript
const sum = eval('10*10+5');
```

## Explanation

`eval` evaluates code that's passed as a string. If it's an expression, like in this case, it evaluates the expression. The expression is `10 * 10 + 5`. This returns the number `105`.
