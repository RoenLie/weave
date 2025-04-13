import { nanoid } from 'nanoid';


type CreatePromiseResolver = <TPromise = unknown>() => Readonly<[
	promise: Promise<TPromise>,
	resolver: (value?: any) => void,
	rejector: (reason?: any) => void,
	id: string,
]>;


/**
 * Simplifies the creation of a promise together with a reference to the resolver and rejector.
 * @example
 * ```ts
 * const [ promise, resolver, rejector, id ] = createPromiseResolver();
 * ```
 */
export const createPromiseResolver: CreatePromiseResolver = <T>() => {
	const id = nanoid(5);
	let resolver: (value?: any) => void = () => {};
	let rejector: () => void = () => {};

	const promise: Promise<T> = new Promise((resolve, reject) => {
		resolver = resolve;
		rejector = reject;
	});

	return [ promise, resolver, rejector, id ];
};
