import { createSegmentedPath, isGroupingSegment, segmentComparer } from './segments.js';


export type TreeRecord<T = any, TEnd = any> = {
	[P in keyof T]: TreeRecord<T[P]> | TEnd;
};


export const pathsToTree = (
	paths: string[],
	groupingKey: string,
	replacements: [from: string | RegExp, to: string][],
) => {
	const tree: TreeRecord = {};

	paths.sort((a, b) => {
		const aSegments = createSegmentedPath(a, groupingKey);
		const bSegments = createSegmentedPath(b, groupingKey);

		for (let i = 0; i < aSegments.length; i++) {
			const aSeg = aSegments[i] ?? '';
			const bSeg = bSegments[i] ?? '';

			const value = segmentComparer(aSeg, bSeg);
			if (value !== 0)
				return value;
		}

		return 0;
	}).forEach(path => {
		/* Split the path into segments */
		const segments = path.split('/');

		/* Filter out the non grouping segments and remove the groupingKey from the segment */
		const filtered = segments.slice(0, -1).filter(s => isGroupingSegment(s, groupingKey));
		/* Add the last segment */
		filtered.push(segments.at(-1) ?? '');

		/* performing string replacements */
		const transformed = filtered.map(s => replacements.reduce(
			(acc, [ from, to ]) => acc.replace(from, to),
			s.replace(new RegExp('^' + groupingKey + '+', 'g'), ''),
		));

		transformed.reduce((acc, cur, i, { length }) => {
			if (i === length - 1)
				acc[cur] = path;

			acc[cur] ??= {};

			return acc[cur];
		}, tree);
	});

	return tree;
};
