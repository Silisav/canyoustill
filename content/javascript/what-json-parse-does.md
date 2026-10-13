---
id: what-json-parse-does
title: What does this method do?
answer: A
options:
  A: "Parses JSON to a JavaScript value"
  B: "Parses a JavaScript object to JSON"
  C: "Parses any JavaScript value to JSON"
  D: "Parses JSON to a JavaScript object only"
source: upstream:lydiahallie#110
---

```javascript
JSON.parse();
```

## Explanation

With the `JSON.parse()` method, we can parse JSON string to a JavaScript value.

```javascript
// Stringifying a number into valid JSON, then parsing the JSON string to a JavaScript value:
const jsonNumber = JSON.stringify(4); // '4'
JSON.parse(jsonNumber); // 4

// Stringifying an array value into valid JSON, then parsing the JSON string to a JavaScript value:
const jsonArray = JSON.stringify([1, 2, 3]); // '[1, 2, 3]'
JSON.parse(jsonArray); // [1, 2, 3]

// Stringifying an object  into valid JSON, then parsing the JSON string to a JavaScript value:
const jsonArray = JSON.stringify({ name: 'Lydia' }); // '{"name":"Lydia"}'
JSON.parse(jsonArray); // { name: 'Lydia' }
```
