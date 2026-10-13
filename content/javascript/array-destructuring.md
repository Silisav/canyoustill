---
id: array-destructuring
title: What's the output?
answer: C
options:
  A: "`[[1, 2, 3, 4, 5]]`"
  B: "`[1, 2, 3, 4, 5]`"
  C: "`1`"
  D: "`[1]`"
source: upstream:lydiahallie#59
---

```javascript
const numbers = [1, 2, 3, 4, 5];
const [y] = numbers;

console.log(y);
```

## Explanation

We can unpack values from arrays or properties from objects through destructuring. For example:

```javascript
[a, b] = [1, 2];
```

![](images/array-destructuring-1.png)

The value of `a` is now `1`, and the value of `b` is now `2`. What we actually did in the question, is:

```javascript
[y] = [1, 2, 3, 4, 5];
```

![](images/array-destructuring-2.png)

This means that the value of `y` is equal to the first value in the array, which is the number `1`. When we log `y`, `1` is returned.
