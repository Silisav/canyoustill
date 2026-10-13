---
id: spreading-a-string
title: What does this return?
answer: A
options:
  A: '`["L", "y", "d", "i", "a"]`'
  B: '`["Lydia"]`'
  C: '`[[], "Lydia"]`'
  D: '`[["L", "y", "d", "i", "a"]]`'
source: upstream:lydiahallie#43
---

```javascript
[...'Lydia'];
```

## Explanation

A string is an iterable. The spread operator maps every character of an iterable to one element.
