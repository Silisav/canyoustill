---
id: private-class-field
title: What's the output?
answer: D
options:
  A: "`10`"
  B: "`11`"
  C: "`undefined`"
  D: "`SyntaxError`"
source: upstream:lydiahallie#139
---

```javascript
class Counter {
  #number = 10

  increment() {
    this.#number++
  }

  getNum() {
    return this.#number
  }
}

const counter = new Counter()
counter.increment()

console.log(counter.#number)
```

## Explanation

In ES2020, we can add private variables in classes by using the `#`. We cannot access these variables outside of the class. When we try to log `counter.#number`, a SyntaxError gets thrown: we cannot access it outside the `Counter` class!
