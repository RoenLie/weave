export const camelCaseToWords = (camelCaseString: string): string => {
	// Use a regular expression to find all capital letters and insert a space before them
	return camelCaseString.replace(/([A-Z])/g, ' $1')
		// Trim any leading spaces
		.trim()
		// Capitalize the first letter
		.replace(/^./, (match) => match.toUpperCase());
};
