---
id: duplicate-object-keys
title: What's the output?
answer: C
options:
  A: '`{ a: "one", b: "two" }`'
  B: '`{ b: "two", a: "three" }`'
  C: '`{ a: "three", b: "two" }`'
  D: "`SyntaxError`"
source: upstream:lydiahallie#25
---

```javascript
const obj = { a: 'one', b: 'two', a: 'three' };
console.log(obj);
```

## Explanation

If you have two keys with the same name, the key will be replaced. It will still be in its first position, but with the last specified value.
