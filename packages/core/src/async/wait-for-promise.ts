/** Iteratively waits for promises in a map. */
export const waitForPromiseMap = async (map: Map<any, Promise<any>>) => {
	// Keep running the loop as long as there are promises in the map
	while (map.size) {
		// Create an array of promises and delete the promise from the map when it's fulfilled
		const promises = Array.from(map).map(e => {
			// On promise fulfillment, delete the key-value pair from the map
			e[1].then(() => map.delete(e[0]));

			// Return the promise for use in Promise.allSettled
			return e[1];
		});

		// Wait for all promises to settle (either fulfilled or rejected)
		await Promise.allSettled(promises);
	}
};


/** Iteratively waits for promises in a set. */
export const waitForPromiseSet = async (set: Set<Promise<any>>) => {
	// Keep running the loop as long as there are promises in the set
	while (set.size) {
		// Create an array of promises and delete the promise from the set when it's fulfilled
		const promises = Array.from(set).map(e => {
			// On promise fulfillment, delete the promise from the set
			e.then(() => set.delete(e));

			// Return the promise for use in Promise.allSettled
			return e;
		});

		// Wait for all promises to settle (either fulfilled or rejected)
		await Promise.allSettled(promises);
	}
};
