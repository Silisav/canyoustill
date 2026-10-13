---
id: continue-in-for-loop
title: What's the output?
answer: C
options:
  A: "`1` `2`"
  B: "`1` `2` `3`"
  C: "`1` `2` `4`"
  D: "`1` `3` `4`"
source: upstream:lydiahallie#27
---

```javascript
for (let i = 1; i < 5; i++) {
  if (i === 3) continue;
  console.log(i);
}
```

## Explanation

The `continue` statement skips an iteration if a certain condition returns `true`.
