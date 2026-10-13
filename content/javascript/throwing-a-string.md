---
id: throwing-a-string
title: What's the output?
answer: D
options:
  A: "`It worked! Hello world!`"
  B: "`Oh no an error: undefined`"
  C: "`SyntaxError: can only throw Error objects`"
  D: "`Oh no an error: Hello world!`"
source: upstream:lydiahallie#52
---

```javascript
function greeting() {
  throw 'Hello world!';
}

function sayHi() {
  try {
    const data = greeting();
    console.log('It worked!', data);
  } catch (e) {
    console.log('Oh no an error:', e);
  }
}

sayHi();
```

## Explanation

With the `throw` statement, we can create custom errors. With this statement, you can throw exceptions. An exception can be a <b>string</b>, a <b>number</b>, a <b>boolean</b> or an <b>object</b>. In this case, our exception is the string `'Hello world!'`.

With the `catch` statement, we can specify what to do if an exception is thrown in the `try` block. An exception is thrown: the string `'Hello world!'`. `e` is now equal to that string, which we log. This results in `'Oh an error: Hello world!'`.
