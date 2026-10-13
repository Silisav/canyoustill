---
id: subclass-constructor-order
title: What's the output?
answer: B
options:
  A: "`I'm pink. 🌸`"
  B: "`I'm pink. 🌸` `I'm a bird. 🦢`"
  C: "`I'm a bird. 🦢` `I'm pink. 🌸`"
  D: "Nothing, we didn't call any method"
source: upstream:lydiahallie#142
---

```javascript
class Bird {
  constructor() {
    console.log("I'm a bird. 🦢");
  }
}

class Flamingo extends Bird {
  constructor() {
    console.log("I'm pink. 🌸");
    super();
  }
}

const pet = new Flamingo();
```

## Explanation

We create the variable `pet` which is an instance of the `Flamingo` class. When we instantiate this instance, the `constructor` on `Flamingo` gets called. First, `"I'm pink. 🌸"` gets logged, after which we call `super()`. `super()` calls the constructor of the parent class, `Bird`. The constructor in `Bird` gets called, and logs `"I'm a bird. 🦢"`.
