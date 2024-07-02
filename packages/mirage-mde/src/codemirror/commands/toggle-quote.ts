import { type ChangeSpec, EditorSelection } from '@codemirror/state';
import { range as createRange } from '@roenlie/mimic-core/array';

import { type MMDECommand } from '../../registry/action-registry.js';
import { getNodesInRange } from '../listeners/get-state.js';

export const toggleQuote: MMDECommand = (view) => {
	const state = view.state;

	const transaction = view.state.changeByRange(range => {
		const changes: ChangeSpec[] = [];

		const firstLineNr = state.doc.lineAt(range.from).number;
		const lastLineNr = state.doc.lineAt(range.to).number;

		const lines = createRange(firstLineNr, lastLineNr + 1)
			.map(lineNr => state.doc.line(lineNr));

		lines.forEach(line => {
			const markers = getNodesInRange(state, { from: line.from, to: line.to });
			const quotemark = markers.find(m => m.marker === 'quotemark');

			if (quotemark) {
				changes.push({
					from:   quotemark.from,
					to:     quotemark.to + 1,
					insert: '',
				});
			}
			else {
				changes.push({
					from:   line.from,
					to:     line.from,
					insert: '> ',
				});
			}
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
