/**
 * Describes how `T` compatible with `M`?
 *
 * - `'equal'`: `T` and `M` are exactly the same.
 * - `'similar'`: `T` is a subset of `M`, such as `'a'` being a subset of `string`.
 * - `'different'`: `T` is not even a subset of `M`.
 */
export type CompatibilityOf<T, M> = [T] extends [M]
	? [M] extends [T]
		? 'equal'
		: 'similar'
	: 'different';


/** A Timeout type which respects the return type of `setTimeout`. */
export type Timeout = ReturnType<typeof setTimeout> | number;


export type ExtractReturnTypes<T extends readonly ((i: any) => any)[]> = [
	...{ [K in keyof T]: T[K] extends ((i: any) => infer R) ? R : never },
];


/**
 * Makes the given keys mandatory.
 */
export type Mandatory<
	Target extends Record<keyof any, any>,
	Keys extends string,
> = {
	[P in keyof Target as P extends Keys ? P : never]-?: Target[P];
} & {
	[P in keyof Target as P extends Keys ? never : P ]: Target[P];
};


/**
 * Makes the given keys optional.
 */
export type Optional<
	Target extends Record<keyof any, any>,
	Keys extends string,
> = {
	[P in keyof Target as P extends Keys ? P : never]?: Target[P];
} & {
	[P in keyof Target as P extends Keys ? never : P ]: Target[P];
};


/**
 * Generates a public interface type that removes private and protected fields.
 * This allows accepting otherwise compatible versions of the type (e.g. from
 * multiple copies of the same package in `node_modules`).
 */
export type Interface<T> = {
	[K in keyof T]: T[K];
} & unknown;
