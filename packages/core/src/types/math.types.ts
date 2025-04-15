// https://stackoverflow.com/questions/54243431/how-can-i-produce-an-incremented-version-of-a-numeric-literal-type-in-typescript
// https://github.com/microsoft/TypeScript/issues/26382

// This is a limited, but performant way to increment and decrement numbers in TypeScript.


type PositiveNumbers = [
	1,  2,  3,  4,  5,  6,  7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
	21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	...number[], // bail out with number
];
type NegativeNumbers = [
	-1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
	20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	...number[], // bail out with number
];


export type Incr<N extends number> = PositiveNumbers[N];
export type Decr<N extends number> = NegativeNumbers[N];


/**
 * Creates a tuple of `T` with a length of `N`.
 */
export type Repeat<N extends number, T> = N extends 0
	? []
	: [T, ...Repeat<Decr<N>, T>];
