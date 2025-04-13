export const shimPromiseWithResolvers = (): void => {
	if (!Promise.withResolvers) {
		Promise.withResolvers = <T>() => {
			let resolve, reject;
			const promise = new Promise((res, rej) => { resolve = res, reject = rej; });

			return { promise, resolve, reject } as unknown as PromiseWithResolvers<T>;
		};
	}
};


export type ResolvablePromise<T = void> = Promise<T> & {
	resolve(value: T): void;
	reject(reason?: any): void;
	done:  boolean;
	value: T | undefined;
};


export const resolvablePromise = <T = void>(): ResolvablePromise<T> => {
	shimPromiseWithResolvers();

	const { promise, resolve, reject } = Promise.withResolvers<T>();

	const superPromise = Object.assign(promise, {
		resolve: (value: T) => {
			superPromise.done = true;
			superPromise.value = value;
			resolve(value);
		},
		reject: (reason?: any) => {
			superPromise.done = true;
			reject(reason);
		},
		done:  false,
		value: undefined as T | undefined,
	});

	return superPromise as ResolvablePromise<T>;
};
resolvablePromise.resolve = <T>(value: T) => {
	const promise = resolvablePromise<T>();
	promise.resolve(value);

	return promise;
};
