## wordCount

The `wordCount` function is a utility function that counts the number of words in a given string. It handles Latin-based characters, Greek, Cyrillic, as well as CJK (Chinese, Japanese, and Korean) characters.

### Syntax

```typescript
wordCount(data: string): number;
```

### Parameters

- **data** (string): The input string for which the word count is to be determined.

### Returns

- **number**: Returns the total number of words in the input string.

### Example

```typescript
import { wordCount } from './wordCount';

const text1 = 'Hello, world! This is a test.';
const text2 = '你好，世界！这是一个测试。';

console.log(wordCount(text1)); // Output: 7
console.log(wordCount(text2)); // Output: 6
```

### Time Complexity

The time complexity of the `wordCount` function is O(n), where n is the length of the input string. This is because the function iterates over the matched words in the input string.
