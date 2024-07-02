/**
 * In what way is `T` compatible with `M`?
 *
 * @returns Compatibility of `T` with `M`
 * 	- `'equal'`: `T` and `M` are exactly the same.
 * 	- `'similar'`: `T` is a subset of `M`, such as `'a'` being a subset of `string`.
 * 	- `'different'`: `T` is not even a subset of `M`. It could be a superset, or completely incompatible.
 */
export type CompatibilityOf<T, M> = [T] extends [M]
	? [M] extends [T]
		? 'equal'
		: 'similar'
	: 'different';
