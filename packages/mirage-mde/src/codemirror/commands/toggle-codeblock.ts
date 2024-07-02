import { type ChangeSpec, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { isRangeInRanges } from '@roenlie/mimic-core/validation';

import { MirageMDE } from '../../mirage-mde.js';
import { type MMDECommand } from '../../registry/action-registry.js';
import { getNodesInRange } from '../listeners/get-state.js';


/**
 * Action for toggling code block.
 */
export const toggleCodeBlock: MMDECommand = (view: EditorView, _scope: MirageMDE) => {
	const state = view.state;
	const ranges = view.state.selection.ranges;

	const activeMarkers = ranges
		.flatMap(range => getNodesInRange(state, range))
		.filter(m => m.marker === 'fencedcode');

	let transaction = state.changeByRange(range => {
		const changes: ChangeSpec[] = [];
		let startDiff = 0;

		activeMarkers.forEach(node => {
			if (!isRangeInRanges([ range ], node))
				return;

			const codeText = state.doc.sliceString(node.from, node.to);
			let start = '';
			codeText.replace(/^```\w*/, str => start = str);
			startDiff += start.length;

			changes.push(
				{
					from:   node.from,
					to:     node.from + start.length,
					insert: '',
				},
				{
					from:   node.to - 3,
					to:     node.to,
					insert: '',
				},
			);
		});

		return {
			changes,
			range: EditorSelection.range(
				range.from - startDiff,
				range.to - startDiff,
			),
		};
	});

	if (!transaction.changes.empty) {
		view.dispatch(view.state.update(transaction));
		view.focus();

		return true;
	}

	transaction = state.changeByRange(range => {
		const changes: ChangeSpec[] = [
			{
				from:   range.from,
				to:     range.from,
				insert: '\n```\n',
			},
			{
				from:   range.to,
				to:     range.to,
				insert: '\n```\n',
			},
		];

		return {
			changes,
			range: EditorSelection.range(
				range.from + 4,
				range.from + 4,
			),
		};
	});


	if (!transaction.changes.empty)
		view.dispatch(view.state.update(transaction));

	view.focus();

	return true;
};
