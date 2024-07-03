/** A promise of a value or the value itself. */
export type Promised<T> = T | Promise<T>;
/** A function which returns a promised value. */
export type Promiser<T> = () => Promised<T>;
/** A promised value or a function which returns a promised value. */
export type PromiseOrFunc<T> = Promised<T> | Promiser<T>;


/** Resolves a promise or function that returns a promise. */
export const resolvePromiseOrFunc = async <T>(promiseOrFunc: PromiseOrFunc<T>): Promise<T> => {
	if (typeof promiseOrFunc === 'function')
		return await (promiseOrFunc as Promiser<T>)();

	return await promiseOrFunc;
};
