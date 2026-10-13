---
id: symbol-property-keys
title: What's the output?
answer: D
options:
  A: '`{Symbol(''a''): ''b''}` and `["{Symbol(''a'')"]`'
  B: "`{}` and `[]`"
  C: '`{ a: "b" }` and `["a"]`'
  D: "`{Symbol('a'): 'b'}` and `[]`"
source: upstream:lydiahallie#97
---

```javascript
const info = {
  [Symbol('a')]: 'b',
};

console.log(info);
console.log(Object.keys(info));
```

## Explanation

A Symbol is not _enumerable_. The Object.keys method returns all _enumerable_ key properties on an object. The Symbol won't be visible, and an empty array is returned. When logging the entire object, all properties will be visible, even non-enumerable ones.

This is one of the many qualities of a symbol: besides representing an entirely unique value (which prevents accidental name collision on objects, for example when working with 2 libraries that want to add properties to the same object), you can also "hide" properties on objects this way (although not entirely. You can still access symbols using the `Object.getOwnPropertySymbols()` method).
