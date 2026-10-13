---
id: prototype-of-arrow-function
title: What's the output?
answer: D
options:
  A: "`{ constructor: ...}` `{ constructor: ...}`"
  B: "`{}` `{ constructor: ...}`"
  C: "`{ constructor: ...}` `{}`"
  D: "`{ constructor: ...}` `undefined`"
source: upstream:lydiahallie#92
---

```javascript
function giveLydiaPizza() {
  return 'Here is pizza!';
}

const giveLydiaChocolate = () =>
  "Here's chocolate... now go hit the gym already.";

console.log(giveLydiaPizza.prototype);
console.log(giveLydiaChocolate.prototype);
```

## Explanation

Regular functions, such as the `giveLydiaPizza` function, have a `prototype` property, which is an object (prototype object) with a `constructor` property. Arrow functions however, such as the `giveLydiaChocolate` function, do not have this `prototype` property. `undefined` gets returned when trying to access the `prototype` property using `giveLydiaChocolate.prototype`.
