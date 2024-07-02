/** Make a PascalCase representation of the `text`. */
export const toPascalCase = (text: string): string => {
	return text.replace(/(^|\W\b)(\w)(\w*)/g, (_, __, firstLetter: string, remainingLetters: string) => {
		return firstLetter.toUpperCase() + remainingLetters.toLowerCase();
	});
};
