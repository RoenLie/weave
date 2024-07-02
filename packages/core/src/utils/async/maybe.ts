import { type Fn } from '../../types/function.types.js';


/**
 * Simplifies code by providing a helper that reduces the amount of try catch
 * that needs to be done.
 * @param promise The promise that may throw.
 * @returns A [data: T, error: unknown] tuple.
 * When the `promise` throws this will be [null, error] and when it does not throw it will be [data, null].
 * @remarks If you don't care about returning the error should use `safe()` instead.
 */
export const maybe = async <T>(
	promise: Promise<T>,
	catchCb?: Fn<unknown, void>,
	finallyCb?: Function,
): Promise<[data: T | null, error: string | null]> => {
	try {
		const data = await promise;

		return [ data, null ];
	}
	catch (error) {
		if (catchCb)
			catchCb(error);

		return [ null, error as string ];
	}
	finally {
		if (finallyCb)
			finallyCb();
	}
};


/**
 * Allows for calling a function that might throw, and receiving its error message for further processing.
 * @returns A [data: T, error: unknown] tuple.
 *
 * When the `invoker` throws this will be [null, error] and when it does not throw it will be [data, null].
 */
export const maybeSync = <T extends Fn, E = Error>(
	invoker: T,
	catchCb?: Fn<unknown, E>,
	finallyCb?: Function,
): [data: ReturnType<T> | null, error: E | null] => {
	try {
		const data = invoker();

		return [ data, null ];
	}
	catch (error) {
		if (catchCb)
			return [ null, catchCb(error) ];

		return [ null, error as E ];
	}
	finally {
		if (finallyCb)
			finallyCb();
	}
};
