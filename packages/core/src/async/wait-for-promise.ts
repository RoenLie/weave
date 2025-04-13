/**
 * Iteratively waits for promises in a map or set.
 *
 * Promises are deleted from the map as they complete.
 */
export const waitForPromises = async (
	map: Map<any, Promise<any>> | Set<any>,
): Promise<void> => {
	// Keep running the loop as long as there are promises.
	while (map.size) {
		// get first entry:
		const first = map.entries().next();
		const [ key, promise ] = first.value as [ any, Promise<any> ];

		try { await promise;	}
		catch { /*  */ }

		map.delete(key);
	}
};
