---
id: emoji-strict-equality
title: What's its value?
answer: A
options:
  A: "`true`"
  B: "`false`"
source: upstream:lydiahallie#107
---

```javascript
console.log('❤️' === '❤️');
```

## Explanation

Under the hood, emojis are unicodes. The unicodes for the heart emoji is `"U+2764 U+FE0F"`. These are always the same for the same emojis, so we're comparing two equal strings to each other, which returns true.
