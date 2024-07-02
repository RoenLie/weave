export const isGroupingSegment = (segment: string, delimiter: string) => {
	return segment.startsWith(delimiter) || /\d+\./.test(segment);
};

export const createSegmentedPath = (path: string, delimiter: string) => {
	const segments = path.split('/');
	const filtered = [
		...segments
			.slice(0, -1)
			.filter(s => isGroupingSegment(s, delimiter))
			.map(s => s
				.replace(delimiter, '')
				.replaceAll('-', ' ')),
		segments.at(-1)!
			.replaceAll('-', ' '),
	];

	return filtered;
};

export const segmentComparer = (a: string, b: string) => {
	const aOrder = parseInt(a.split('.').at(0) ?? '');
	const bOrder = parseInt(b.split('.').at(0) ?? '');
	let value = 0;

	if (isNaN(aOrder) && isNaN(bOrder))
		value = a.localeCompare(b);
	else
		value = aOrder - bOrder;

	return value;
};
