---
id: calling-a-string
title: What's the output?
answer: C
options:
  A: "`SyntaxError`"
  B: "`ReferenceError`"
  C: "`TypeError`"
  D: "`undefined`"
source: upstream:lydiahallie#99
---

```javascript
const name = 'Lydia';

console.log(name());
```

## Explanation

The variable `name` holds the value of a string, which is not a function, and thus cannot be invoked.

TypeErrors get thrown when a value is not of the expected type. JavaScript expected `name` to be a function since we're trying to invoke it. It was a string however, so a TypeError gets thrown: name is not a function!

SyntaxErrors get thrown when you've written something that isn't valid JavaScript, for example when you've written the word `return` as `retrun`.
ReferenceErrors get thrown when JavaScript isn't able to find a reference to a value that you're trying to access.
