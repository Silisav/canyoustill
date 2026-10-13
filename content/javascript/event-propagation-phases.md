---
id: event-propagation-phases
title: What are the three phases of event propagation?
answer: D
options:
  A: "Target > Capturing > Bubbling"
  B: "Bubbling > Target > Capturing"
  C: "Target > Bubbling > Capturing"
  D: "Capturing > Target > Bubbling"
source: upstream:lydiahallie#13
---

## Explanation

During the **capturing** phase, the event goes through the ancestor elements down to the target element. It then reaches the **target** element, and **bubbling** begins.

![](images/event-propagation-phases-1.png)
