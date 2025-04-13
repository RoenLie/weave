/**
 * Creates an array of numbers from first to last.
 */
export const range = (first: number, last?: number, step = 1): number[] => {
	if (last === undefined) {
		last = first;
		first = 0;
	}

	if (first > last)
		[ last, first ] = [ first, last ]; // Swaps values of first and last.

	const result: number[] = [];
	for (let i = first; i < last; i += step)
		result.push(i);

	return result;
};
