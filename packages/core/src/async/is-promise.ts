/** A promise of a value or the value itself. */
export type Promised<T> = T | Promise<T>;
/** A function which returns a promised value. */
export type Promiser<T> = () => Promised<T>;
/** A promised value or a function which returns a promised value. */
export type DynamicPromise<T> = Promised<T> | Promiser<T>;


/** Checks if data is a promise. */
export const isPromise = <T>(promise: Promised<T>): promise is Promise<T> => promise instanceof Promise;

/** Convert a dynamic promise to a promise. */
export const resolveDynamicPromise = async <T>(dynamic: DynamicPromise<T>): Promise<T> => {
	if (typeof dynamic === 'function')
		return await (dynamic as Promiser<T>)();

	return await dynamic;
};
