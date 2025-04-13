/**
 * Wraps a function that generates a `Promise`.\
 * Will return the same promise to all callers until promise has been resolved\
 * and flush argument was set to true.
 */
export const cachedPromise = <T extends (...args: any) => Promise<any>>(
	func: T,
	/**
	 * Clear the cache after response has completed?
	 * @default true
	 */
	flush = true,
) => {
	let promise: Promise<Awaited<ReturnType<T>>> | undefined;

	return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
		if (promise)
			return promise;

		promise = func(...args);
		if (flush)
			promise.finally(() => promise = undefined);

		return promise;
	};
};
