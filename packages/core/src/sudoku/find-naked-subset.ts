import { iterate } from '../utils/iterators/iterator-pipeline.js';


export const findNakedSubset = (sets: number[][], n: number) => {
	const validSets = sets.filter(s => s.length > 1 && s.length <= n);

	// find groups where the sets share atleast one number.
	const combinedSets = iterate(validSets).pipe(set => {
		const combinations = validSets.filter(s => {
			if (s === set)
				return false;

			if (set.some(sset => s.includes(sset)))
				return true;
		});

		if (combinations.length === n - 1)
			return [ set, ...combinations ];
	}).toArray();

	// remove groups where sets have numbers the others do not.
	const filtered = findRepresentedGroup(combinedSets);


	//console.dir({ validSets, combinedSets, filtered }, { depth: null });

	return [ ...new Set(filtered.flat(2)) ];
};


function findRepresentedGroup(groups: number[][][]) {
	return groups.find((group) => {
		// Sort each array in the group
		const sortedGroup = group.map(arr => arr.slice().sort((a, b) => a - b));

		// Check if each array is represented by at least one other array in the group
		return sortedGroup.every((currentSet, i) => {
			// Create an array of all other arrays in the group
			const otherSets: number[][] = [];
			for (let j = 0; j < sortedGroup.length; j++) {
				if (j !== i)
					otherSets.push(sortedGroup[j]!);
			}

			// Check if each value in the current array is represented by the other arrays
			// Or atleast one if the one being checked is smaller.
			return currentSet.every((val) => {
				// SOMETHING WRONG HERE.
				// NEED TO CHECK THAT A SET HAS ALL ITS MEMBERS REPRESENTED IN ANY OTHER SET THAT IS OF EQUAL LENGTH OR HIGHER.


				// Check if the current value is present in any other array
				const hasValue = otherSets.flat().includes(val);
				if (hasValue)
					return true;

				// Check if the current array is smaller than any other array
				const smallerArray = otherSets.some(other => other.length > currentSet.length);

				// Check if the current array has at least one value in common with any other array
				const hasAtleastOneCommonValue = otherSets.some(other => {
					return other.some((key) => other.includes(key));
				});

				// Return true if any of the conditions are true
				return (smallerArray && hasAtleastOneCommonValue);
			});
		});
	}) || [];
}
