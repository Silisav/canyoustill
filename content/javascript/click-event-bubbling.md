---
id: click-event-bubbling
title: When you click the paragraph, what's the logged output?
answer: A
options:
  A: "`p` `div`"
  B: "`div` `p`"
  C: "`p`"
  D: "`div`"
source: upstream:lydiahallie#32
---

```html
<div onclick="console.log('div')">
  <p onclick="console.log('p')">
    Click here!
  </p>
</div>
```

## Explanation

If we click `p`, we see two logs: `p` and `div`. During event propagation, there are 3 phases: capturing, targeting, and bubbling. By default, event handlers are executed in the bubbling phase (unless you set `useCapture` to `true`). It goes from the deepest nested element outwards.
