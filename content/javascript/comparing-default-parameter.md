---
id: comparing-default-parameter
title: What's its value?
answer: B
options:
  A: "`Not the same!`"
  B: "`They are the same!`"
  C: "`ReferenceError`"
  D: "`SyntaxError`"
source: upstream:lydiahallie#105
---

```javascript
function compareMembers(person1, person2 = person) {
  if (person1 !== person2) {
    console.log('Not the same!');
  } else {
    console.log('They are the same!');
  }
}

const person = { name: 'Lydia' };

compareMembers(person);
```

## Explanation

Objects are passed by reference. When we check objects for strict equality (`===`), we're comparing their references.

We set the default value for `person2` equal to the `person` object, and passed the `person` object as the value for `person1`.

This means that both values have a reference to the same spot in memory, thus they are equal.

The code block in the `else` statement gets run, and `They are the same!` gets logged.
