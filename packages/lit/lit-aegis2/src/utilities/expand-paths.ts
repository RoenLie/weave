/**
 * This function takes an array of arrays containing strings
 * and returns an array of all possible combinations of those strings,
 * separated by a period `.`
 *
 * @example
 * ```
 * input = [ ['a', 'b'], ['c', 'd'] ];
 * output = [ 'a.c', 'a.d', 'b.c', 'b.d' ]
 * ```
 * _
 */
export const crossProductOfPaths = (arrays: string[][]) => {
	// Create a new array to store all possible combinations
	let combinations: string[] = arrays[0]!;

	// Loop through each array in the input
	for (let i = 1; i < arrays.length; i++) {
		// Get the current array
		const currentArray = arrays[i]!;

		// Create a new array to store the new combinations
		const newCombinations = [];

		// Loop through each combination in the combinations array
		for (const currentCombination of combinations) {
			// Loop through each string in the current array
			for (const currentString of currentArray) {
				// Concatenate the current combination with the current string and add it to the new combinations array
				newCombinations.push(currentCombination + '.' + currentString);
			}
		}

		// Set the combinations array to the new combinations
		combinations = newCombinations;
	}

	// Return the combinations array
	return combinations;
};
