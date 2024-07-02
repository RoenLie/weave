import { type ChangeSpec, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { iterate } from '@roenlie/mimic-core/iterators';
import { isRangeInRanges } from '@roenlie/mimic-core/validation';

import { getNodesInRange } from '../listeners/get-state.js';


/**
 * Toggles the heading of selected line.
 *
 * @example
 * // Decrease heading size
 * toggleHeading(editorView);
 *
 * // Increase heading size
 * toggleHeading(editorView, { direction: 'bigger' });
 *
 * // Set heading size to 3
 * toggleHeading(editorView, { size: 3 });
 */
export const toggleHeading = (view: EditorView, options?: {
	direction?: 'smaller' | 'bigger',
	size?: number
}) => {
	const { direction = 'smaller', size } = options ?? {};

	const state = view.state;
	const ranges = view.state.selection.ranges;
	const activeMarkers = ranges.flatMap(range => getNodesInRange(state, range));

	const transaction = state.changeByRange(range => {
		const changes: ChangeSpec[] = [];
		let diff = 0;

		const foundActive = iterate(activeMarkers)
			.pipe(node => {
				if (!isRangeInRanges([ range ], node))
					return;

				const headingLevel = extractHeadingLevel(node.marker);
				if (headingLevel === undefined)
					return;

				const nextHeading = size ?? rotateWithinRange(
					0, 6, headingLevel, direction === 'smaller' ? 1 : -1,
				);

				// If you are trying to apply the same style, remove it.
				if (headingLevel === nextHeading) {
					changes.push({
						from:   node.from,
						to:     node.from + headingLevel + 1,
						insert: '',
					});

					diff -= headingLevel + 1;

					return true;
				}

				diff += (nextHeading - headingLevel);

				if (nextHeading === 0) {
					changes.push({
						from:   node.from,
						to:     node.from + headingLevel + 1,
						insert: '',
					});

					diff -= 1;
				}
				else {
					changes.push(
						{
							from:   node.from,
							to:     node.from + headingLevel,
							insert: '#'.repeat(nextHeading),
						},
					);
				}

				return true;
			})
			.toArray();

		if (!foundActive.length) {
			const lineStart = view.state.doc.lineAt(range.from).from;
			const nextHeading = size ?? (direction === 'smaller' ? 1 : 6);
			const insert = '#'.repeat(nextHeading) + ' ';

			changes.push({
				from: lineStart,
				to:   lineStart,
				insert,
			});

			diff += insert.length;
		}

		return {
			changes,
			range: EditorSelection.range(
				range.to + diff,
				range.to + diff,
			),
		};
	});

	if (!transaction.changes.empty)
		view.dispatch(view.state.update(transaction));

	view.focus();

	return true;
};


const extractHeadingLevel = (input: string): number | undefined => {
	const regex = /^H(\d)/;

	const match = input.match(regex);
	if (match)
		return parseInt(match[1]!, 10);
};


const rotateWithinRange = (
	min: number, max: number, current: number, step: number,
): number => {
	if (min >= max)
		throw new Error('Min must be less than max');

	const range = max - min + 1;
	const normalizedCurrent = current - min;
	const incrementedValue = (normalizedCurrent + step) % range;

	return incrementedValue + min;
};
