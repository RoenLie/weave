// eslint-disable-next-line @stylistic/max-len
const pattern = /[a-zA-Z0-9_\u00A0-\u02AF\u0392-\u03c9\u0410-\u04F9]+|[\u4E00-\u9FFF\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g;


/* The right word count in respect for CJK. */
export const wordCount = (data: string): number => {
	const m = data.match(pattern);
	let count = 0;
	if (m === null)
		return count;

	for (const char of m) {
		if (char.charCodeAt(0) >= 0x4E00)
			count += char.length;
		else
			count += 1;
	}

	return count;
};
