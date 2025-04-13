/**
 * This function removes a specified string from the end of another string
 * if the second string ends with the specified string.
 *
 * Otherwise, it returns the original string.
 */
export const trimPostfix = (str: string, postfix: string): string =>
	str.endsWith(postfix) ? str.slice(0, -postfix.length) : str;
