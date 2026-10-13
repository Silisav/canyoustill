---
id: logical-or-chains
title: What's the value of output?
answer: C
options:
  A: "`false` `null` `[]`"
  B: '`null` `""` `true`'
  C: '`{}` `""` `[]`'
  D: "`null` `null` `true`"
source: upstream:lydiahallie#101
---

```javascript
const one = false || {} || null;
const two = null || false || '';
const three = [] || 0 || true;

console.log(one, two, three);
```

## Explanation

With the `||` operator, we can return the first truthy operand. If all values are falsy, the last operand gets returned.

`(false || {} || null)`: the empty object `{}` is a truthy value. This is the first (and only) truthy value, which gets returned. `one` is equal to `{}`.

`(null || false || "")`: all operands are falsy values. This means that the last operand, `""` gets returned. `two` is equal to `""`.

`([] || 0 || "")`: the empty array`[]` is a truthy value. This is the first truthy value, which gets returned. `three` is equal to `[]`.
