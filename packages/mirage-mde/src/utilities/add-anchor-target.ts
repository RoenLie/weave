const anchorToExternalRegex = new RegExp(/(<a.*?https?:\/\/.*?[^a]>)+?/g);


/**
 * Modify HTML to add 'target="_blank"' to links so they open in new tabs by default.
 * @return The modified HTML text.
 */
export const addAnchorTargetBlank = (htmlText: string): string => {
	let match;
	while ((match = anchorToExternalRegex.exec(/** HTML to be modified. */ htmlText)) !== null) {
		// With only one capture group in the RegExp, we can safely take the first index from the match.
		const linkString = match[0];

		if (linkString.indexOf('target=') === -1) {
			const fixedLinkString = linkString.replace(/>$/, ' target="_blank">');
			htmlText = htmlText.replace(linkString, fixedLinkString);
		}
	}

	return htmlText;
};
