// eslint-disable-next-line @stylistic/max-len
// https://stackoverflow.com/questions/54243431/how-can-i-produce-an-incremented-version-of-a-numeric-literal-type-in-typescript
// https://github.com/microsoft/TypeScript/issues/26382

export type Increment<N extends number> = [
	1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
	...number[] // bail out with number
][N];


export type Decrement<N extends number> = [
	-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
	...number[] // bail out with number
][N];

/**
 * Creates a tuple of `T` with a length of `N`.
 */
export type Repeat<N extends number, T> = N extends 0
	? []
	: [T, ...Repeat<Decrement<N>, T>];
