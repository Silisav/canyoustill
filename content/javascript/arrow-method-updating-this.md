---
id: arrow-method-updating-this
title: What's the output?
answer: A
options:
  A: "`my@email.com`"
  B: "`new@email.com`"
  C: "`undefined`"
  D: "`ReferenceError`"
source: upstream:lydiahallie#151
---

```javascript
const user = {
	email: "my@email.com",
	updateEmail: email => {
		this.email = email
	}
}

user.updateEmail("new@email.com")
console.log(user.email)
```

## Explanation

The `updateEmail` function is an arrow function, and is not bound to the `user` object. This means that the `this` keyword is not referring to the `user` object, but refers to  the global scope in this case. The value of `email` within the `user` object does not get updated. When logging the value of `user.email`, the original value of `my@email.com` gets returned.
