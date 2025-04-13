export const removeSegments = (string: string, delimiter: string, segments: number): string =>
	string.split(delimiter).slice(0, -segments).join(delimiter);
