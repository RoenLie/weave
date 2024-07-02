export type NameReplacement = [from: string, to: string];

export const replaceInName = (name: string, replacements: NameReplacement[]): string => {
	if (!name)
		return '';

	return replacements.reduce<string>(
		(acc, [ from, to ]) => acc.replaceAll(from, to),
		(name.replace(/^\d+\./, '')),
	);
};
