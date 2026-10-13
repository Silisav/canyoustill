---
id: tagged-template-arguments
title: What's the output?
answer: B
options:
  A: '`"Lydia"` `21` `["", " is ", " years old"]`'
  B: '`["", " is ", " years old"]` `"Lydia"` `21`'
  C: '`"Lydia"` `["", " is ", " years old"]` `21`'
source: upstream:lydiahallie#17
---

```javascript
function getPersonInfo(one, two, three) {
  console.log(one);
  console.log(two);
  console.log(three);
}

const person = 'Lydia';
const age = 21;

getPersonInfo`${person} is ${age} years old`;
```

## Explanation

If you use tagged template literals, the value of the first argument is always an array of the string values. The remaining arguments get the values of the passed expressions!
