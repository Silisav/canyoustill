---
id: prefix-vs-postfix-increment
title: What's the output?
answer: C
options:
  A: "`1` `1` `2`"
  B: "`1` `2` `2`"
  C: "`0` `2` `2`"
  D: "`0` `1` `2`"
source: upstream:lydiahallie#16
---

```javascript
let number = 0;
console.log(number++);
console.log(++number);
console.log(number);
```

## Explanation

The **postfix** unary operator `++`:

1. Returns the value (this returns `0`)
2. Increments the value (number is now `1`)

The **prefix** unary operator `++`:

1. Increments the value (number is now `2`)
2. Returns the value (this returns `2`)

This returns `0 2 2`.
