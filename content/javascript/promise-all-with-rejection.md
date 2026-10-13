---
id: promise-all-with-rejection
title: What's the output?
answer: D
options:
  A: "`[['First', 'Second'], ['Fourth']]`"
  B: "`[['First', 'Second'], ['Third', 'Fourth']]`"
  C: "`[['First', 'Second']]`"
  D: "`'Third'`"
source: upstream:lydiahallie#152
---

```javascript
const promise1 = Promise.resolve('First')
const promise2 = Promise.resolve('Second')
const promise3 = Promise.reject('Third')
const promise4 = Promise.resolve('Fourth')

const runPromises = async () => {
	const res1 = await Promise.all([promise1, promise2])
	const res2  = await Promise.all([promise3, promise4])
	return [res1, res2]
}

runPromises()
	.then(res => console.log(res))
	.catch(err => console.log(err))
```

## Explanation

The `Promise.all` method runs the passed promises in parallel. If one promise fails, the `Promise.all` method _rejects_ with the value of the rejected promise. In this case, `promise3` is rejected with the value `"Third"`. We’re catching the rejected value in the chained `catch` method on the `runPromises` invocation to catch any errors  within the `runPromises` function. Only `"Third"` gets logged, since `promise3` is rejected with this value.
