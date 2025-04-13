/**
 * Does the array contain all of the other items?
 */
export const hasSameElements = (array: unknown[], other: unknown[]): boolean => {
	// Early return if lengths are not equal
	if (array.length !== other.length)
		return false;

	const arraySet: Set<unknown> = new Set(array);

	// Check if the Set's size is the same as the input array's length
	if (arraySet.size !== array.length)
		return false;

	for (const otherItem of other) {
		if (!arraySet.has(otherItem))
			return false;
	}

	return true;
};


/**
 * Determines if there is any common element between two given arrays.
 */
export const hasCommonElement = (arr1: unknown[], arr2: unknown[]): boolean => {
	const set = new Set(arr1);
	for (const item of arr2) {
		if (set.has(item))
			return true;
	}

	return false;
};
