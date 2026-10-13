---
id: setinterval-return-value
title: What does the `setInterval` method return in the browser?
answer: A
options:
  A: "a unique id"
  B: "the amount of milliseconds specified"
  C: "the passed function"
  D: "`undefined`"
source: upstream:lydiahallie#42
---

```javascript
setInterval(() => console.log('Hi'), 1000);
```

## Explanation

It returns a unique id. This id can be used to clear that interval with the `clearInterval()` function.
