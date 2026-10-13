---
id: this-in-arrow-function
title: What's the output?
answer: B
options:
  A: "`20` and `62.83185307179586`"
  B: "`20` and `NaN`"
  C: "`20` and `63`"
  D: "`NaN` and `63`"
source: upstream:lydiahallie#3
---

```javascript
const shape = {
  radius: 10,
  diameter() {
    return this.radius * 2;
  },
  perimeter: () => 2 * Math.PI * this.radius,
};

console.log(shape.diameter());
console.log(shape.perimeter());
```

## Explanation

Note that the value of `diameter` is a regular function, whereas the value of `perimeter` is an arrow function.

With arrow functions, the `this` keyword refers to its current surrounding scope, unlike regular functions! This means that when we call `perimeter`, it doesn't refer to the shape object, but to its surrounding scope (window for example).

Since there is no value `radius` in the scope of the arrow function, `this.radius` returns `undefined` which, when multiplied by `2 * Math.PI`, results in `NaN`.
