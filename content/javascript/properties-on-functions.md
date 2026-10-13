---
id: properties-on-functions
title: What happens when we do this?
answer: A
options:
  A: "Nothing, this is totally fine!"
  B: "`SyntaxError`. You cannot add properties to a function this way."
  C: '`"Woof"` gets logged.'
  D: "`ReferenceError`"
source: upstream:lydiahallie#10
---

```javascript
function bark() {
  console.log('Woof!');
}

bark.animal = 'dog';
```

## Explanation

This is possible in JavaScript, because functions are objects! (Everything besides primitive types are objects)

A function is a special type of object. The code you write yourself isn't the actual function. The function is an object with properties. This property is invocable.
