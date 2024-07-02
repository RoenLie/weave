import { toWords } from '../../../shared/to-words.js';


/** Split the `text` by words and apply kebab casing. */
export const toTagName = (text: string, prefix?: string, postfix?: string): string => {
	let tag = toWords(text, '-')
		.toLowerCase()
		.replaceAll('.', '-')
		.replaceAll('--', '-');

	if (prefix)
		tag = prefix + '-' + tag;
	if (postfix)
		tag += '-' + postfix;

	return tag;
};
