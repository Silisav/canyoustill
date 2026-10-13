---
id: concatenating-emoji
title: What's the output?
answer: A
options:
  A: '`"🥑💻"`'
  B: "`257548`"
  C: "A string containing their code points"
  D: "Error"
source: upstream:lydiahallie#70
---

```javascript
console.log('🥑' + '💻');
```

## Explanation

With the `+` operator, you can concatenate strings. In this case, we are concatenating the string `"🥑"` with the string `"💻"`, resulting in `"🥑💻"`.
