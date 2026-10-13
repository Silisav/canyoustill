---
id: curried-arrow-functions
title: What's the output?
answer: A
options:
  A: "`4` `5` `6`"
  B: "`6` `5` `4`"
  C: "`4` `function` `function`"
  D: "`undefined` `undefined` `6`"
source: upstream:lydiahallie#123
---

```javascript
const add = x => y => z => {
  console.log(x, y, z);
  return x + y + z;
};

add(4)(5)(6);
```

## Explanation

The `add` function returns an arrow function, which returns an arrow function, which returns an arrow function (still with me?). The first function receives an argument `x` with the value of `4`. We invoke the second function, which receives an argument `y` with the value `5`. Then we invoke the third function, which receives an argument `z` with the value `6`. When we're trying to access the value `x`, `y` and `z` within the last arrow function, the JS engine goes up the scope chain in order to find the values for `x` and `y` accordingly. This returns `4` `5` `6`.
