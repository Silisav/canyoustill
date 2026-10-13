---
id: call-vs-bind
title: What's the output?
answer: D
options:
  A: "`undefined is 21` `Lydia is 21`"
  B: "`function` `function`"
  C: "`Lydia is 21` `Lydia is 21`"
  D: "`Lydia is 21` `function`"
source: upstream:lydiahallie#33
---

```javascript
const person = { name: 'Lydia' };

function sayHi(age) {
  return `${this.name} is ${age}`;
}

console.log(sayHi.call(person, 21));
console.log(sayHi.bind(person, 21));
```

## Explanation

With both, we can pass the object to which we want the `this` keyword to refer to. However, `.call` is also _executed immediately_!

`.bind.` returns a _copy_ of the function, but with a bound context! It is not executed immediately.
