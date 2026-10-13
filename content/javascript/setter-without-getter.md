---
id: setter-without-getter
title: What's the output?
answer: D
options:
  A: "`function language(lang) { this.languages.push(lang }`"
  B: "`0`"
  C: "`[]`"
  D: "`undefined`"
source: upstream:lydiahallie#121
---

```javascript
const config = {
  languages: [],
  set language(lang) {
    return this.languages.push(lang);
  },
};

console.log(config.language);
```

## Explanation

The `language` method is a `setter`. Setters don't hold an actual value, their purpose is to _modify_ properties. When calling a `setter` method, `undefined` gets returned.
