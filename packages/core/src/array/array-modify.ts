/**
 * Move the element from one index to another, shifting other items up or down accordingly.
 * If you overflow the length of the array undefined elements will be added to fill.
 */
export const arrayMove = <T>(
	array: (T | undefined)[],
	old_index: number,
	new_index: number,
): (T | undefined)[] => {
	if (new_index >= array.length) {
		let k = new_index - array.length;
		while ((k--) + 1)
			array.push(undefined);
	}

	array.splice(new_index, 0, array.splice(old_index, 1)[0]!);

	return array;
};

/**
 * Remove the item if it can be found (by reference).
 * @param item The item to be removed.
 * @returns Wether or not the item was removed.
 */
export const arrayRemove = <T>(array: T[], item: T): boolean => {
	const index = array.indexOf(item);

	return arrayRemoveAt(array, index);
};

/**
 * Remove the item at the given index.
 * @param index The index of the item to remove.
 * @returns Wether or not the item was removed.
 */
export const arrayRemoveAt = <T>(array: T[], index: number): boolean => {
	if (index > -1) {
		array.splice(index, 1);

		return true;
	}

	return false;
};
