---
id: parseint-with-expression
title: What's the value of `num`?
answer: C
options:
  A: "`42`"
  B: '`"42"`'
  C: "`7`"
  D: "`NaN`"
source: upstream:lydiahallie#49
---

```javascript
const num = parseInt('7*6', 10);
```

## Explanation

Only the first number in the string is returned. Based on the _radix_ (the second argument in order to specify what type of number we want to parse it to: base 10, hexadecimal, octal, binary, etc.), the `parseInt` checks whether the characters in the string are valid. Once it encounters a character that isn't a valid number in the radix, it stops parsing and ignores the following characters.

`*` is not a valid number. It only parses `"7"` into the decimal `7`. `num` now holds the value of `7`.
