/**
 * Encode and escape URLs to prevent breaking up rendered Markdown links.
 */
export const escapePromptURL = (url: string) => {
	return encodeURI(url).replace(/([\\()])/g, '\\$1');
};
