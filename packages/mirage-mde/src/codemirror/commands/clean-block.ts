import { type ChangeSpec, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { isRangeInRanges } from '@roenlie/mimic-core/validation';

import { type MMDECommand } from '../../registry/action-registry.js';
import { getAllNodesInRange } from '../listeners/get-state.js';


/**
 * Action for clean block (remove headline, list, blockquote code, markers)
 */
export const cleanBlock: MMDECommand = (view: EditorView) => {
	const markValidator = (mark: {
		from: number;
		to: number;
		name: string;
	}) => {
		return [
			mark.name.includes('Mark'),
			mark.name === 'HorizontalRule',
		].some(Boolean);
	};

	const nodes = view.state.selection.ranges.flatMap(
		range => getAllNodesInRange(view.state, range),
	).filter(markValidator);

	const transaction = view.state.changeByRange(range => {
		const changes: ChangeSpec[] = [];

		nodes.forEach(node => {
			if (!isRangeInRanges([ range ], node))
				return;

			changes.push({
				from:   node.from,
				to:     node.to,
				insert: '',
			});
		});

		const changeSet = view.state.changes(changes);

		return {
			changes,
			range: EditorSelection.range(
				changeSet.mapPos(range.anchor, 1),
				changeSet.mapPos(range.head, 1),
			),
		};
	});


	if (!transaction.changes.empty)
		view.dispatch(view.state.update(transaction));


	view.focus();

	return true;
};
