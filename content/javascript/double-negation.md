---
id: double-negation
title: What's the output?
answer: B
options:
  A: "`false` `true` `false`"
  B: "`false` `false` `true`"
  C: "`false` `true` `true`"
  D: "`true` `true` `false`"
source: upstream:lydiahallie#41
---

```javascript
!!null;
!!'';
!!1;
```

## Explanation

`null` is falsy. `!null` returns `true`. `!true` returns `false`.

`""` is falsy. `!""` returns `true`. `!true` returns `false`.

`1` is truthy. `!1` returns `false`. `!false` returns `true`.
