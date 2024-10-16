export const isGroupingSegment = (segment: string, groupingKey: string) => {
	return segment.startsWith(groupingKey) || /\d+\./.test(segment);
};

export const createSegmentedPath = (path: string, groupingKey: string) => {
	const segments = path.split('/');
	const filtered = [
		...segments
			.slice(0, -1)
			.filter(s => isGroupingSegment(s, groupingKey))
			.map(s => s
				.replace(groupingKey, '')
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
