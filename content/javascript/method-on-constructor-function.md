---
id: method-on-constructor-function
title: What's the output?
answer: A
options:
  A: "`TypeError`"
  B: "`SyntaxError`"
  C: "`Lydia Hallie`"
  D: "`undefined` `undefined`"
source: upstream:lydiahallie#11
---

```javascript
function Person(firstName, lastName) {
  this.firstName = firstName;
  this.lastName = lastName;
}

const member = new Person('Lydia', 'Hallie');
Person.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

console.log(member.getFullName());
```

## Explanation

In JavaScript, functions are objects, and therefore, the method `getFullName` gets added to the constructor function object itself. For that reason, we can call `Person.getFullName()`, but `member.getFullName` throws a `TypeError`. 

If you want a method to be available to all object instances, you have to add it to the prototype property:

```js
Person.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};
```
