---
id: deleting-prototype-method
title: What's the output?
answer: A
options:
  A: '`"Woof I am Mara"`, `TypeError`'
  B: '`"Woof I am Mara"`, `"Woof I am Mara"`'
  C: '`"Woof I am Mara"`, `undefined`'
  D: "`TypeError`, `TypeError`"
source: upstream:lydiahallie#55
---

```javascript
class Dog {
  constructor(name) {
    this.name = name;
  }
}

Dog.prototype.bark = function() {
  console.log(`Woof I am ${this.name}`);
};

const pet = new Dog('Mara');

pet.bark();

delete Dog.prototype.bark;

pet.bark();
```

## Explanation

We can delete properties from objects using the `delete` keyword, also on the prototype. By deleting a property on the prototype, it is not available anymore in the prototype chain. In this case, the `bark` function is not available anymore on the prototype after `delete Dog.prototype.bark`, yet we still try to access it.

When we try to invoke something that is not a function, a `TypeError` is thrown. In this case `TypeError: pet.bark is not a function`, since `pet.bark` is `undefined`.
