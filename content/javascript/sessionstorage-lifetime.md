---
id: sessionstorage-lifetime
title: How long is cool_secret accessible?
answer: B
options:
  A: "Forever, the data doesn't get lost."
  B: "When the user closes the tab."
  C: "When the user closes the entire browser, not only the tab."
  D: "When the user shuts off their computer."
source: upstream:lydiahallie#22
---

```javascript
sessionStorage.setItem('cool_secret', 123);
```

## Explanation

The data stored in `sessionStorage` is removed after closing the _tab_.

If you used `localStorage`, the data would've been there forever, unless for example `localStorage.clear()` is invoked.
