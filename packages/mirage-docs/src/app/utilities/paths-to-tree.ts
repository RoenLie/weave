import { type NameReplacement, replaceInName } from './name-replacement.js';
import { createSegmentedPath, isGroupingSegment, segmentComparer } from './segments.js';

export type TreeRecord<T = any, TEnd = any> = {
	[P in keyof T]: TreeRecord<T[P]> | TEnd;
};

export const pathsToTree = (paths: string[], delimiter: string, nameReplacements: NameReplacement[]) => {
	const tree: TreeRecord = {};

	paths.sort((a, b) => {
		const aSegments = createSegmentedPath(a, delimiter);
		const bSegments = createSegmentedPath(b, delimiter);

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

		/* Filter out any non grouping segments */
		const filtered = [
			/* Filter out the non grouping segments and
			remove the delimiter from the segment */
			...segments
				.slice(0, -1)
				.filter(s => isGroupingSegment(s, delimiter))
				.map(s => s
					.replace(delimiter, '')
					.replace(/^\d+\./, '')
					.replaceAll('-', ' ')),
			/* Add the last segment after performing string replacements
			to use as the last part of path */
			replaceInName(segments.at(-1) ?? '', nameReplacements),
		];

		filtered.reduce((acc, cur, i, { length }) => {
			if (i === length - 1)
				acc[cur] = path;

			acc[cur] ??= {};

			return acc[cur];
		}, tree);
	});

	return tree;
};
