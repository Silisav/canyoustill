---
id: building-object-from-pairs
title: 'What should the value of `method` be to log `{ name: "Lydia", age: 22 }`?'
answer: C
options:
  A: "`entries`"
  B: "`values`"
  C: "`fromEntries`"
  D: "`forEach`"
source: upstream:lydiahallie#153
---

```javascript
const keys = ["name", "age"]
const values = ["Lydia", 22]

const method = /* ?? */
Object[method](keys.map((_, i) => {
	return [keys[i], values[i]]
})) // { name: "Lydia", age: 22 }
```

## Explanation

The `fromEntries` method turns a 2d array into an object. The first element in each subarray will be the key, and the second element in each subarray will be the value. In this case, we’re mapping over the `keys` array, which returns an array that the first element is the item on the key array on the current index, and the second element is the item of the values array on the current index. 

This creates an array of subarrays containing the correct keys and values, which results in `{ name: "Lydia", age: 22 }`
