---
id: missing-argument
title: What is the output?
answer: B
options:
  A: "`Hi there,`"
  B: "`Hi there, undefined`"
  C: "`Hi there, null`"
  D: "`ReferenceError`"
source: upstream:lydiahallie#81
---

```javascript
function sayHi(name) {
  return `Hi there, ${name}`;
}

console.log(sayHi());
```

## Explanation

By default, arguments have the value of `undefined`, unless a value has been passed to the function. In this case, we didn't pass a value for the `name` argument. `name` is equal to `undefined` which gets logged.

In ES6, we can overwrite this default `undefined` value with default parameters. For example:

`function sayHi(name = "Lydia") { ... }`

In this case, if we didn't pass a value or if we passed `undefined`, `name` would always be equal to the string `Lydia`
