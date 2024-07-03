## isRangeInRanges

The `isRangeInRanges` function checks if a given target range overlaps with any range in an array of ranges.

### Syntax

```typescript
isRangeInRanges(ranges: Range[], targetRange: Range): boolean;
```

### Parameters

- **ranges** (Range[]): The array of ranges to check against.
- **targetRange** (Range): The target range to check for overlaps.

### Returns

- **boolean**: Returns `true` if the target range overlaps with any range in the input array of ranges, otherwise `false`.

### Example

```typescript
import { isRangeInRanges, Range } from './isRangeInRanges';

const ranges: Range[] = [
	{ from: 1, to: 5 },
	{ from: 10, to: 15 },
];

const targetRange: Range = { from: 4, to: 8 };

console.log(isRangeInRanges(ranges, targetRange)); // Output: true
```

### Time Complexity

The time complexity of the `isRangeInRanges` function is O(n*m), where n is the number of ranges in the input array and m is the length of the largest range. The function iterates over each range and checks each number within the range for overlaps.

<br>

---

<br>

## isNumberInRange

The `isNumberInRange` function checks if a given number falls within a specified range.

### Syntax

```typescript
isNumberInRange(range: Range, current: number): boolean;
```

### Parameters

- **range** (Range): The range to check against, containing `from` and `to` properties.
- **current** (number): The number to check if it falls within the range.

### Returns

- **boolean**: Returns `true` if the number falls within the specified range, otherwise `false`.

### Example

```typescript
import { isNumberInRange, Range } from './isNumberInRange';

const range: Range = { from: 1, to: 5 };
const numberToCheck = 3;

console.log(isNumberInRange(range, numberToCheck)); // Output: true
```

### Time Complexity

The time complexity of the `isNumberInRange` function is O(1), as the function checks the number against the specified range in constant time.
