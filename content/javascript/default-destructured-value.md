---
id: default-destructured-value
title: What's the output?
answer: C
options:
  A: '`{ email: "my@email.com", address: null }`'
  B: '`{ email: "my@email.com" }`'
  C: '`{ email: "my@email.com", address: {} }`'
  D: '`{ email: "my@email.com", address: undefined }`'
source: upstream:lydiahallie#154
---

```javascript
const createMember = ({ email, address = {}}) => {
	const validEmail = /.+\@.+\..+/.test(email)
	if (!validEmail) throw new Error("Valid email pls")

	return {
		email,
		address: address ? address : null
	}
}

const member = createMember({ email: "my@email.com" })
console.log(member)
```

## Explanation

The default value of `address` is an empty object `{}`. When we set the variable `member` equal to the object returned by the `createMember` function, we didn't pass a value for the address, which means that the value of the address is the default empty object `{}`. An empty object is a truthy value, which means that the condition of the `address ? address : null` conditional returns `true`. The value of the address is the empty object `{}`.
