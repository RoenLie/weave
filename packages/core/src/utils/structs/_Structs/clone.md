## clone

The `clone` function is a utility function that creates a deep copy of a given object, array, or any other data structure, including nested structures. It handles circular references and allows for custom instantiation of objects with specific constructors.

### Syntax

```typescript
clone<T>(
	input: T,
	instantiate?: InstantiationFunction,
): T;
```

### Parameters

- **input** (T): The input value or data structure to be cloned.
- **instantiate?** (InstantiationFunction): An optional function that, if provided, will be used to instantiate objects with specific constructors. It takes the original object as a parameter and should return a new instance of the same type.

### Returns

- **T**: Returns a deep copy of the input value or data structure.

### Example

```typescript
import { clone } from './clone';

const original = {
  a: 1,
  b: {
    c: 2,
    d: [3, 4],
  },
  e: new Date(),
};

const copied = clone(original);

console.log(copied); // Output: Deep copy of the original object
console.log(copied !== original); // Output: true
```

### Time Complexity

The time complexity of the `clone` function is O(n), where n is the total number of elements in the input data structure (including nested structures). The function recursively traverses the entire input data structure, copying each element.
