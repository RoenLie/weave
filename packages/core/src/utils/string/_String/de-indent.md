## deIndent

The `deIndent` function takes a multiline string as input and removes the common leading whitespace from each line, effectively normalizing the indentation.

### Syntax

```typescript
deIndent(multilineString: string): string;
```

### Parameters

- **multilineString** (string): A multiline string with varying levels of indentation.

### Returns

- **string**: Returns a string with normalized indentation.

### Example

```typescript
import { deIndent } from './deIndent';

const indentedString = `
  This is
    a sample
  multiline
    string`;

const deIndentedString = deIndent(indentedString);

console.log(deIndentedString);
// Output:
// This is
//   a sample
// multiline
//   string
```

### Time Complexity

The time complexity of the `deIndent` function is O(n), where n is the number of lines in the input string and m is the average number of characters per line. The function iterates through the lines once to find the shortest indent and normalize the lines simultaneously.
