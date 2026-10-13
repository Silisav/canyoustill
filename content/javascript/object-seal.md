---
id: object-seal
title: Which of the following will modify the `person` object?
answer: A
options:
  A: '`person.name = "Evan Bacon"`'
  B: "`person.age = 21`"
  C: "`delete person.name`"
  D: "`Object.assign(person, { age: 21 })`"
source: upstream:lydiahallie#136
---

```javascript
const person = { name: 'Lydia Hallie' };

Object.seal(person);
```

## Explanation

With `Object.seal` we can prevent new properties from being _added_, or existing properties to be _removed_.

However, you can still modify the value of existing properties.
