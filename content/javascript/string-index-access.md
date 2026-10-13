---
id: string-index-access
title: What's the output?
answer: B
options:
  A: '`"""`'
  B: '`"I"`'
  C: "`SyntaxError`"
  D: "`undefined`"
source: upstream:lydiahallie#87
---

```javascript
console.log('I want pizza'[0]);
```

## Explanation

In order to get a character at a specific index of a string, you can use bracket notation. The first character in the string has index 0, and so on. In this case, we want to get the element with index 0, the character `"I'`, which gets logged.

Note that this method is not supported in IE7 and below. In that case, use `.charAt()`.
