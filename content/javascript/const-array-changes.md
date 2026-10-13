---
id: const-array-changes
title: Which of the options result(s) in an error?
answer: D
options:
  A: "1"
  B: "1 and 2"
  C: "3 and 4"
  D: "3"
source: upstream:lydiahallie#143
---

```javascript
const emojis = ['🎄', '🎅🏼', '🎁', '⭐'];

/* 1 */ emojis.push('🦌');
/* 2 */ emojis.splice(0, 2);
/* 3 */ emojis = [...emojis, '🥂'];
/* 4 */ emojis.length = 0;
```

## Explanation

The `const` keyword simply means we cannot _redeclare_ the value of that variable, it's _read-only_. However, the value itself isn't immutable. The properties on the `emojis` array can be modified, for example by pushing new values, splicing them, or setting the length of the array to 0.
