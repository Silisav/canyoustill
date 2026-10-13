---
id: number-isnan-vs-isnan
title: What's the output?
answer: C
options:
  A: "`true` `false` `true` `false`"
  B: "`true` `false` `false` `false`"
  C: "`false` `false` `true` `false`"
  D: "`false` `true` `false` `true`"
source: upstream:lydiahallie#128
---

```javascript
const name = 'Lydia Hallie';
const age = 21;

console.log(Number.isNaN(name));
console.log(Number.isNaN(age));

console.log(isNaN(name));
console.log(isNaN(age));
```

## Explanation

With the `Number.isNaN` method, you can check if the value you pass is a _numeric value_ and equal to `NaN`. `name` is not a numeric value, so `Number.isNaN(name)` returns `false`. `age` is a numeric value, but is not equal to `NaN`, so `Number.isNaN(age)` returns `false`.

With the `isNaN` method, you can check if the value you pass is not a number. `name` is not a number, so `isNaN(name)` returns true. `age` is a number, so `isNaN(age)` returns `false`.
