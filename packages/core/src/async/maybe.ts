import { type Fn } from '../types/function.types.js';


export type Maybe<T> = readonly [data: T, error: undefined] | [data: undefined, error: Error];


/**
 * Simplifies code by providing a helper that reduces the amount of try catch
 * that needs to be done.
 * @returns A [data: T, error: unknown] tuple.
 * When the `promise` throws this will be [undefined, error]
 * and when it does not throw it will be [data, undefined].
 */
export const maybe = async <T>(
	promise: Promise<T>,
	catchCb?: Fn<unknown, void>,
	finallyCb?: (...args: any) => any,
): Promise<Maybe<T>> => {
	try {
		return [ await promise, undefined ];
	}
	catch (error) {
		if (catchCb)
			catchCb(error);

		return [ undefined, error as Error ];
	}
	finally {
		if (finallyCb)
			finallyCb();
	}
};


export const maybeAll = async <T>(
	promises: Promise<T>[],
	catchCb?: Fn<unknown, void>,
	finallyCb?: (...args: any) => any,
): Promise<Maybe<T[]>> => {
	try {
		return [ await Promise.all(promises), undefined ];
	}
	catch (error) {
		if (catchCb)
			catchCb(error);

		return [ undefined, error as Error ];
	}
	finally {
		if (finallyCb)
			finallyCb();
	}
};


export const maybeSome = async <T>(
	promises: Promise<T>[],
): Promise<readonly [data: T[], error: any[]]> => {
	const data: T[] = [];
	const errors: Error[] = [];

	const settled = await Promise.allSettled(promises);
	for (const result of settled) {
		if (result.status === 'fulfilled')
			data.push(result.value);
		else
			errors.push(result.reason);
	}

	return [ data, errors ];
};


/**
 * Allows for calling a function that might throw
 * and receiving its error message for further processing.
 * @returns A [data: T, error: unknown] tuple.
 *
 * When the `invoker` throws this will be [undefined, error]
 * and when it does not throw it will be [data, undefined].
 */
export const maybeSync = <T extends Fn>(
	invoker: T,
	catchCb?: Fn<unknown, void>,
	finallyCb?: (...args: any) => any,
): Maybe<ReturnType<T>> => {
	try {
		const data = invoker();

		return [ data, undefined ];
	}
	catch (error) {
		if (catchCb)
			catchCb(error);

		return [ undefined, error as Error ];
	}
	finally {
		if (finallyCb)
			finallyCb();
	}
};
