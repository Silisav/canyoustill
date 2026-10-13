---
id: separate-class-instances
title: What's the output?
answer: A
options:
  A: "`0`"
  B: "`1`"
  C: "`undefined`"
  D: "`ReferenceError`"
source: upstream:lydiahallie#147
---

```javascript
class Calc {
	constructor() {
		this.count = 0 
	}

	increase() {
		this.count++
	}
}

const calc = new Calc()
new Calc().increase()

console.log(calc.count)
```

## Explanation

We set the variable `calc` equal to a new instance of the `Calc` class. Then, we instantiate a new instance of `Calc`, and invoke the `increase` method on this instance. Since the count property is within the constructor of the `Calc` class, the count property is not shared on the prototype of `Calc`. This means that the value of count has not been updated for the instance calc points to, count is still `0`.
