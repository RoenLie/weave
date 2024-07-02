export const deIndent = (multilineString: string) => {
	// Split the string into an array of lines
	const lines = multilineString.split('\n');

	// Initialize the shortestIndent to Infinity and an empty array for storing normalized lines
	let shortestIndent = Infinity;
	const normalizedLines: string[] = [];

	// Iterate through the lines, find the shortest indent, and normalize the lines
	for (const line of lines) {
		const leadingWhitespace = line.match(/^\s*/)?.[0];

		// Update the shortestIndent
		const currentIndent = leadingWhitespace?.length ?? 0;
		shortestIndent = Math.min(shortestIndent, currentIndent);

		// Normalize the line by removing the shortest indent and add it to the normalizedLines array
		normalizedLines.push(line.slice(currentIndent));
	}

	// Join the normalized lines back into a single string
	return normalizedLines.join('\n');
};
