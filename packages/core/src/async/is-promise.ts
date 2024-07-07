/** A promise of a value or the value itself. */
export type Promised<T> = T | Promise<T>;

/** A function which returns a promised value. */
export type Promiser<T> = () => Promised<T>;

/** A promised value or a function which returns a promised value. */
export type PromiseOrFunc<T> = Promised<T> | Promiser<T>;

/** Resolves a promise or function that returns a promise. */
export const resolvePromiseOrFunc = <T>(promiseOrFunc: PromiseOrFunc<T>): Promise<T> | T => {
	if (typeof promiseOrFunc === 'function') {
		const returnVal = (promiseOrFunc as Promiser<T>)();

		return returnVal instanceof Promise
			? returnVal : returnVal;
	}

	return promiseOrFunc instanceof Promise
		? promiseOrFunc : promiseOrFunc;
};
