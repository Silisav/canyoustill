---
id: object-reference-assignment
title: What's the output?
answer: A
options:
  A: "`Hello`"
  B: "`Hey!`"
  C: "`undefined`"
  D: "`ReferenceError`"
  E: "`TypeError`"
source: upstream:lydiahallie#6
---

```javascript
let c = { greeting: 'Hey!' };
let d;

d = c;
c.greeting = 'Hello';
console.log(d.greeting);
```

## Explanation

In JavaScript, all objects interact by _reference_ when setting them equal to each other.

First, variable `c` holds a value to an object. Later, we assign `d` with the same reference that `c` has to the object.

![](images/object-reference-assignment-1.png)

When you change one object, you change all of them.
