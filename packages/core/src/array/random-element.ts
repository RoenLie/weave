/**
 * Returns a random element of an array
 */
export const randomElement = <Type>(array: Type[]): Type => {
	if (array.length == 0)
		throw new RangeError('No elements in array');

	const randomIndex = Math.floor(Math.random() * array.length);

	return array[randomIndex]!;
};
