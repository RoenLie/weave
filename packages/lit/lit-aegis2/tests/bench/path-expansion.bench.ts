import { bench, describe } from 'vitest';


const createAllPermutations = (lineages: string[][]) => {
	type Tracker = { cur: number; max: number; lineage: string[] };
	const tracker: Tracker[] = lineages.map(l => ({ cur: 0, max: l.length - 1, lineage: l })).reverse();
	const paths: string[] = [];
	let trackerIndex = 0;

	const accumulate = () => {
		let focus = tracker[trackerIndex]!;
		let canIncrement = focus.cur < focus.max;
		let allMax = tracker.every(t => t.cur === t.max);
		const createStringPath = () => tracker.map(t => t.lineage[t.cur]!).reverse().join('.');

		if (canIncrement) {
			paths.push(createStringPath());
			focus.cur ++;

			if (trackerIndex > 0) {
				tracker.slice(0, trackerIndex).forEach(t => t.cur = 0);
				trackerIndex = 0;
			}

			return;
		}

		if (allMax) {
			paths.push(createStringPath());

			return;
		}

		trackerIndex++;
	};

	while (tracker.some(m => m.cur !== m.max))
		accumulate();

	accumulate();

	return paths;
};

const crossProductOfPaths = (arrays: string[][]) => {
	// Create a new array to store all possible combinations
	let combinations: string[] = arrays[0] ?? [];

	// Loop through each array in the input
	for (let i = 1; i < arrays.length; i++) {
		// Get the current array
		let currentArray = arrays[i]!;

		// Create a new array to store the new combinations
		let newCombinations: string[] = [];

		// Loop through each combination in the combinations array
		for (let j = 0; j < combinations.length; j++) {
			// Get the current combination
			let currentCombination = combinations[j];

			// Loop through each string in the current array
			for (let k = 0; k < currentArray.length; k++) {
				// Get the current string
				let currentString = currentArray[k];

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


const generateInput = (innerMin: number, innerMax: number, outerSize: number) => {
	let input: string[][] = [];

	// Create a large number of arrays with a large number of strings in each array
	for (let i = 0; i < outerSize; i++) {
		let array: string[] = [];

		// Generate a random size for the inner array within the specified range
		let innerSize = Math.floor(Math.random() * (innerMax - innerMin + 1)) + innerMin;

		for (let j = 0; j < innerSize; j++)
			array.push('string' + j);

		input.push(array);
	}

	return input;
};


const input = generateInput(5, 20, 4);

describe.skip('Test Suite description', () => {
	bench('human', () => {
		createAllPermutations(input);
	});

	bench('ai', () => {
		crossProductOfPaths(input);
	});
});
