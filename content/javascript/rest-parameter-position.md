---
id: rest-parameter-position
title: What's the output?
answer: D
options:
  A: '`["banana", "apple", "pear", "orange"]`'
  B: '`[["banana", "apple"], "pear", "orange"]`'
  C: '`["banana", "apple", ["pear"], "orange"]`'
  D: "`SyntaxError`"
source: upstream:lydiahallie#94
---

```javascript
function getItems(fruitList, ...args, favoriteFruit) {
  return [...fruitList, ...args, favoriteFruit]
}

getItems(["banana", "apple"], "pear", "orange")
```

## Explanation

`...args` is a rest parameter. The rest parameter's value is an array containing all remaining arguments, **and can only be the last parameter**! In this example, the rest parameter was the second parameter. This is not possible, and will throw a syntax error.

```javascript
function getItems(fruitList, favoriteFruit, ...args) {
  return [...fruitList, ...args, favoriteFruit];
}

getItems(['banana', 'apple'], 'pear', 'orange');
```

The above example works. This returns the array `[ 'banana', 'apple', 'orange', 'pear' ]`
