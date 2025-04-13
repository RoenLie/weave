export const deIndent = (multilineString: string): string => {
	// Remove leading or ending newline
	multilineString = multilineString
		.replaceAll(/^\\n/g, '')
		.replaceAll(/$\\n/g, '');

	// Split the string into an array of lines
	const lines = multilineString.split('\n');

	// Initialize the shortestIndent to Infinity and an empty array for storing normalized lines
	let shortestIndent = Infinity;
	const normalizedLines: string[] = [];

	// Iterate through the lines, find the shortest indent
	for (const line of lines) {
		const leadingWhitespace = line.match(/^\s*/)?.[0];

		// Update the shortestIndent
		const currentIndent = leadingWhitespace?.length ?? 0;
		shortestIndent = Math.min(shortestIndent, currentIndent);
	}

	// Iterate through the lines, normalize the lines
	for (const line of lines) {
		// Normalize the line by removing the shortest indent
		// and add it to the normalizedLines array
		normalizedLines.push(line.slice(shortestIndent));
	}

	// Join the normalized lines back into a single string
	return normalizedLines.join('\n');
};
