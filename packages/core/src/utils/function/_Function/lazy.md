## lazy

The `lazy` function is a higher-order utility function that allows the creation of a lazily-initialized object. It takes a function `fn` as an argument and returns an object with a single property `value`. The property `value` is initialized by calling `fn` only when it is accessed for the first time.

### Syntax

```typescript
lazy<T>(fn: () => T): { value: T };
```

### Parameters

- **fn** (() => T): A function that returns the value to be lazily-initialized.

### Returns

- **{ value: T }**: Returns an object with a single property `value` that is lazily-initialized.

### Example

```typescript
import { lazy } from './lazy';

const expensiveCalculation = () => {
  console.log('Performing expensive calculation...');
  return 42;
};

const lazyObject = lazy(expensiveCalculation);

console.log('Before accessing value:');
console.log(lazyObject.value); // Output: Performing expensive calculation... \n 42
console.log('After accessing value:');
console.log(lazyObject.value); // Output: 42
```

### Time Complexity

The time complexity of the `lazy` function is O(1) as it simply returns a proxy object with a `get` trap. The time complexity of accessing the `value` property depends on the time complexity of the function `fn`.
