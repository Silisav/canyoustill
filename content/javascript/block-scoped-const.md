---
id: block-scoped-const
title: What is the output?
answer: C
options:
  A: '`"Sorry, you''re too young."`'
  B: '`"Yay! You''re old enough!"`'
  C: "`ReferenceError`"
  D: "`undefined`"
source: upstream:lydiahallie#84
---

```javascript
function checkAge(age) {
  if (age < 18) {
    const message = "Sorry, you're too young.";
  } else {
    const message = "Yay! You're old enough!";
  }

  return message;
}

console.log(checkAge(21));
```

## Explanation

Variables with the `const` and `let` keywords are _block-scoped_. A block is anything between curly brackets (`{ }`). In this case, the curly brackets of the if/else statements. You cannot reference a variable outside of the block it's declared in, a ReferenceError gets thrown.
