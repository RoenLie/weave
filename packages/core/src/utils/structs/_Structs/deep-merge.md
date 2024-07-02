## deepMerge

The `deepMerge` function is a utility function that recursively merges two or more objects or arrays. It handles nested structures and provides options for controlling the merge behavior for arrays.

### Syntax

```typescript
deepMerge<T extends Record<keyof any, any> | any[]>(
	objects: Partial<T>[],
	options: { array?: 'merge'|'extend' | 'override' } = {},
): T;
```

### Parameters

- **objects** (Partial<T>[]): The array of objects or arrays to merge.
- **options** ({ array?: 'merge'|'extend' | 'override' } = {}): Optional merge options.
  - **array** ('merge'|'extend' | 'override'): Determines how arrays are merged. Default is 'extend'.
    - 'merge': Arrays will be merged by index.
    - 'extend': Arrays will be concatenated (default behavior).
    - 'override': Arrays from the latter object will replace the former object's array.

### Returns

- **T**: Returns the merged object or array.

### Example

```typescript
import { deepMerge } from './deepMerge';

const obj1 = {
	a: 1,
	b: { c: 2 },
	d: [1, 2],
};

const obj2 = {
	b: { d: 3 },
	d: [3, 4],
};

const merged = deepMerge([obj1, obj2], { array: 'extend' });

console.log(merged);
// Output: { a: 1, b: { c: 2, d: 3 }, d: [1, 2, 3, 4] }
```

### Time Complexity

The time complexity of the `deepMerge` function is O(n), where n is the total number of elements in the input objects or arrays (including nested structures). The function recursively traverses the entire input objects or arrays, merging each element.
