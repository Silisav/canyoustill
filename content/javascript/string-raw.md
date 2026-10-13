---
id: string-raw
title: What's the output?
answer: C
options:
  A: "`Hello world!`"
  B: "`Hello` <br />&nbsp; &nbsp; &nbsp;`world`"
  C: '`Hello\nworld`'
  D: '`Hello\n` <br /> &nbsp; &nbsp; &nbsp;`world`'
source: upstream:lydiahallie#72
---

```javascript
console.log(String.raw`Hello\nworld`);
```

## Explanation

`String.raw` returns a string where the escapes (`\n`, `\v`, `\t` etc.) are ignored! Backslashes can be an issue since you could end up with something like:

`` const path = `C:\Documents\Projects\table.html` ``

Which would result in:

`"C:DocumentsProjects able.html"`

With `String.raw`, it would simply ignore the escape and print:

`C:\Documents\Projects\table.html`

In this case, the string is `Hello\nworld`, which gets logged.
