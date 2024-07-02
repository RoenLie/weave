## range

The `range` function creates an array of numbers starting from the first number up to, but not including, the last number. An optional step can be provided to determine the increments between each number in the resulting array.

### Syntax

```typescript
range(first: number, last?: number, step = 1): number[];
```

### Parameters

- **first** (number): The first number in the range. If `last` is not provided, `first` is used as the last number, and the first number defaults to 0.
- **last** (number, optional): The last number in the range, not included in the resulting array. If not provided, `first` is used as the last number.
- **step** (number, optional): The increment between each number in the resulting array. Defaults to 1.

### Returns

- **number[]**: Returns an array of numbers within the specified range.

### Example

```typescript
import { range } from './range';

const start = 1;
const end = 5;

console.log(range(start, end)); // Output: [1, 2, 3, 4]
```

### Time Complexity

The time complexity of the `range` function is O(n), where n is the number of elements in the resulting array. The function iterates from the first number to the last number with a given step, adding each number to the array.
