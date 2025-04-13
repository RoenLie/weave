/**
 * The `lazy` function is a higher-order utility function that allows the creation of a lazily-initialized object.
 *
 * It takes a function `fn` as an argument and returns an object with a single property `value`.
 *
 * The property `value` is initialized by calling `fn` only when it is accessed for the first time.
 */
export const lazy = <T>(fn: () => T): {
	value: T;
} => {
	let initialized = false;

	// Create a proxy object to intercept access to the `value` property
	const prox = new Proxy({} as { value: T; }, {
		// Define a `get` trap for the proxy object
		get: (target, prop) => {
			// If the accessed property is not 'value', return the original property value
			if (prop !== 'value')
				return (target as any)[prop];

			// If the value has not been initialized yet, initialize it by calling `fn`
			if (!initialized) {
				target.value = fn();
				initialized = true;
			}

			// Return the initialized value
			return target.value;
		},
	});

	return prox as { value: T; };
};
