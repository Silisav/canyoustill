---
id: typeof-rest-parameter
title: What's the output?
answer: C
options:
  A: '`"number"`'
  B: '`"array"`'
  C: '`"object"`'
  D: '`"NaN"`'
source: upstream:lydiahallie#19
---

```javascript
function getAge(...args) {
  console.log(typeof args);
}

getAge(21);
```

## Explanation

The rest parameter (`...args`) lets us "collect" all remaining arguments into an array. An array is an object, so `typeof args` returns `"object"`
