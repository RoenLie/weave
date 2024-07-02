## arraySum

The `arraySum` function is a utility function that calculates the sum of all numbers in an array. It handles numbers, as well as null and undefined values, which will be treated as 0.

### Syntax

```typescript
arraySum(arr: (number | null | undefined)[]): number;
```

### Parameters

- **arr** ((number | null | undefined)[]): The input array containing numbers, null, or undefined values.

### Returns

- **number**: Returns the sum of all numbers in the input array. Null and undefined values are treated as 0.

### Example

```typescript
import { arraySum } from './arraySum';

const array1 = [1, 2, 3, 4, 5];
const array2 = [1, null, 3, undefined, 5];

console.log(arraySum(array1)); // Output: 15
console.log(arraySum(array2)); // Output: 9
```

### Time Complexity

The time complexity of the `arraySum` function is O(n), where n is the length of the input array. This is because the function uses the `reduce` method, which iterates over each element in the array.

<br>

---

<br>

## arrayObjSum

The `arrayObjSum` function is a utility function that calculates the sum of all numbers in an array of objects using a prop function. The prop function is used to extract the numeric value from each object in the array.

### Syntax

```typescript
arrayObjSum<T extends Record<keyof any, any>>(
	arr: T[], prop: (obj: T) => any,
): number;
```

### Parameters

- **arr** (T[]): The input array containing objects.
- **prop** ((obj: T) => any): A prop function that takes an object from the input array and returns a numeric value to be summed.

### Returns

- **number**: Returns the sum of all numeric values extracted from the objects in the input array using the prop function.

### Example

```typescript
import { arrayObjSum } from './arrayObjSum';

const array = [
	{ value: 1 },
	{ value: 2 },
	{ value: 3 },
	{ value: 4 },
];

console.log(arrayObjSum(array, (obj) => obj.value)); // Output: 10
```

### Time Complexity

The time complexity of the `arrayObjSum` function is O(n), where n is the length of the input array. This is because the function uses the `reduce` method, which iterates over each element in the array.
