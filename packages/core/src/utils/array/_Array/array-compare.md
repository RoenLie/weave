## hasSameElements

The `hasSameElements` function is a utility function that compares two arrays to check if they contain the same elements, without considering the order of the elements.

### Syntax

```typescript
hasSameElements(array: unknown[], other: unknown[]): boolean;
```

### Parameters

- **array** (unknown[]): The first input array to compare.
- **other** (unknown[]): The second input array to compare.

### Returns

- **boolean**: Returns `true` if both input arrays have the same elements, and `false` otherwise.

### Example

```typescript
import { hasSameElements } from './hasSameElements';

const array1 = [1, 2, 3, 4];
const array2 = [4, 3, 2, 1];
const array3 = [1, 2, 3, 5];

console.log(hasSameElements(array1, array2)); // Output: true
console.log(hasSameElements(array1, array3)); // Output: false
```

### Time Complexity

The time complexity of the `hasSameElements` function is O(n + m), where n is the length of the first input array and m is the length of the second input array.

<br>

---

<br>

## hasCommonElement

The `hasCommonElement` function is a utility function that checks if there is any common element between two given arrays.

### Syntax

```typescript
hasCommonElement(arr1: unknown[], arr2: unknown[]): boolean;
```

### Parameters

- **arr1** (unknown[]): The first input array to compare.
- **arr2** (unknown[]): The second input array to compare.

### Returns

- **boolean**: Returns `true` if there is at least one common element between the two input arrays, and `false` otherwise.

### Example

```typescript
import { hasCommonElement } from './hasCommonElement';

const array1 = [1, 2, 3, 4];
const array2 = [4, 5, 6, 7];
const array3 = [8, 9, 10, 11];

console.log(hasCommonElement(array1, array2)); // Output: true
console.log(hasCommonElement(array1, array3)); // Output: false
```

### Time Complexity

The time complexity of the `hasCommonElement` function is O(n + m), where n is the length of the first input array and m is the length of the second input array.
