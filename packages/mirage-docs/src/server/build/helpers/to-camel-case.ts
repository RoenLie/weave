/** Make a camelCase representation of the `text`. */
export const toCamelCase = (text: string): string => {
	return text.replace(/(^|\W\b)(\w)(\w*)/g, (match: string, separator: string, firstLetter: string, remainingLetters: string) => {
		return separator
			? firstLetter.toUpperCase() + remainingLetters.toLowerCase()
			: match.toLowerCase();
	});
};
