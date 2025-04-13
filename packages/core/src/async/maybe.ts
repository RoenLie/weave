import { type Fn } from '../types/function.types.js';


export type Maybe<T> =
| readonly [data: T, error: undefined]
| readonly [data: undefined, error: Error];


/**
 * When it succeeds it will be `[data, undefined]`
 *
 *
 * When it throws this will be `[undefined, error]`
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


/**
 * When it succeeds it will be `[data, undefined]`
 *
 *
 * When it throws this will be `[undefined, error]`
 */
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


/**
 * Returns a tuple with an array of the successfull data results
 * and another with the error messages.
 */
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
 * When it succeeds it will be `[data, undefined]`
 *
 *
 * When it throws this will be `[undefined, error]`
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
