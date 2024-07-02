/** Split the `text` into words using the `delimiter` (default: ' '). */
export const toWords = (text: string, delimiter = ' '): string => {
	const result = text
		// replace non-letters with delimiter
		.replace(/\P{L}+/gu, delimiter)
		// add delimiter before uppercase followed by lowercase
		.replace(/(\p{Lu})(?=\p{Ll})/gu, delimiter + '$&');

	if (result.startsWith(delimiter))
		return result.substring(delimiter.length);

	return result;
};
