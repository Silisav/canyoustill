---
id: event-target-nested-elements
title: What is the event.target when clicking the button?
answer: C
options:
  A: "Outer `div`"
  B: "Inner `div`"
  C: "`button`"
  D: "An array of all nested elements."
source: upstream:lydiahallie#31
---

```html
<div onclick="console.log('first div')">
  <div onclick="console.log('second div')">
    <button onclick="console.log('button')">
      Click!
    </button>
  </div>
</div>
```

## Explanation

The deepest nested element that caused the event is the target of the event. You can stop bubbling by `event.stopPropagation`
