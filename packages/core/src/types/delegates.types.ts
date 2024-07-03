/**
 * Creator function which may optionally take a `key: TKey` parameter.
 */
export type CreatorFn<TValue, TKey = unknown> = unknown extends TKey
	? () => TValue
	: (key: TKey) => TValue;


/**
 * Provides a value, either as is or through a `CreatorFn`.
 * Optionally set a TKey which will be passed to the `CreatorFn`.
 */
export type ValueProvider<TValue, TKey = unknown> = TValue | CreatorFn<TValue, TKey>;
