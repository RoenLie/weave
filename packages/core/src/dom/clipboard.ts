const fallbackCopyTextToClipboard = (text: string) => {
	const textArea = document.createElement('textarea');
	textArea.value = text;

	// Avoid scrolling to bottom
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.position = 'fixed';

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		const successful = document.execCommand('copy');
		const msg = successful ? 'successful' : 'unsuccessful';
		console.log('Fallback: Copying text command was ' + msg);
	}
	catch (err) {
		console.error('Fallback: Oops, unable to copy', err);
	}

	document.body.removeChild(textArea);
};


export const copyTextToClipboard = async (text: string): Promise<void> => {
	if (!navigator.clipboard) {
		fallbackCopyTextToClipboard(text);

		return;
	}

	try {
		await navigator.clipboard.writeText(text);
		console.log('Copying to clipboard was successful!');
	}
	catch (err) {
		console.error('Could not copy text: ', err);
	}
};
