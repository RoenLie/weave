export const stringDedent = (
	string: string,
	options?: Partial<{
		trim?: boolean;
		count?: number;
		closest?: boolean;
	}>,
) => {
	const { trim = true, closest = true } = options ?? {};
	let { count = Infinity } = options ?? {};

	if (trim)
		string = string.trim();

	if (closest) {
		count = Math.min(
			...string.split('\n')
				.map(s => countFirstCharSequence(s, '\t'))
				.filter(n => n > 0),
		);
	}

	const lines = string.split('\n');

	for (let i = 0; i < lines.length; i++) {
		let iteration = 0;
		while (lines[i]?.startsWith('\t') && (count && iteration < count)) {
			lines[i] = lines[i]!.replace('\t', '');
			iteration++;
		}
	}

	return lines.join('\n');
};

export const countFirstCharSequence = (content: string, char: string) => {
	let tabCount = 0;

	for (const element of content) {
		const isTab = element === char;

		if (tabCount > 0 && !isTab)
			break;
		if (isTab)
			tabCount++;
	}

	return tabCount;
};
