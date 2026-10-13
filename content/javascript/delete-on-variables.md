---
id: delete-on-variables
title: What's the output?
answer: A
options:
  A: "`false`, `true`"
  B: '`"Lydia"`, `21`'
  C: "`true`, `true`"
  D: "`undefined`, `undefined`"
source: upstream:lydiahallie#58
---

```javascript
const name = 'Lydia';
age = 21;

console.log(delete name);
console.log(delete age);
```

## Explanation

The `delete` operator returns a boolean value: `true` on a successful deletion, else it'll return `false`. However, variables declared with the `var`, `const`, or `let` keywords cannot be deleted using the `delete` operator.

The `name` variable was declared with a `const` keyword, so its deletion is not successful: `false` is returned. When we set `age` equal to `21`, we actually added a property called `age` to the global object. You can successfully delete properties from objects this way, also the global object, so `delete age` returns `true`.
