import { insertTab as cmInsertTab } from '@codemirror/commands';
import { type ChangeSpec, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { range as createRange } from '@roenlie/mimic-core/array';

import { type MMDECommand } from '../../registry/action-registry.js';
import { getNodesInRange } from '../listeners/get-state.js';
import { undoTab } from './undo-tab.js';


export const insertTab: MMDECommand = (view: EditorView) => {
	const state = view.state;

	const transaction = state.changeByRange(range => {
		const changes: ChangeSpec[] = [];

		const firstLine = state.doc.lineAt(range.from);
		const lastLine = state.doc.lineAt(range.to);

		const lines = createRange(firstLine.number, lastLine.number + 1)
			.map(nr => state.doc.line(nr));

		lines.forEach(line => {
			const markers = getNodesInRange(state, { from: line.from, to: line.to });
			const listmark = markers.find(m => m.marker === 'listmark');

			if (listmark || lines.length > 1) {
				changes.push({
					from:   line.from,
					to:     line.from,
					insert: '   ',
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

	if (!transaction.changes.empty) {
		view.dispatch(view.state.update(transaction));

		return true;
	}


	return cmInsertTab(view);
};


export const removeTab: MMDECommand = (view: EditorView) => {
	const state = view.state;

	const transaction = view.state.changeByRange(range => {
		const changes: ChangeSpec[] = [];

		const firstLine = view.state.doc.lineAt(range.from);
		const lastLine = state.doc.lineAt(range.to);

		const lines = createRange(firstLine.number, lastLine.number + 1)
			.map(nr => state.doc.line(nr));

		lines.forEach(line => {
			const lineText = state.doc.sliceString(line.from, line.to);

			let lengthToRemove: number | undefined = undefined;
			switch (true) {
			case /^\t/.test(lineText): {
				lengthToRemove = 1;
				break;
			}
			case /^ {3}/.test(lineText): {
				lengthToRemove = 3;
				break;
			}
			case /^ {2}/.test(lineText): {
				lengthToRemove = 2;
				break;
			}
			case /^ /.test(lineText): {
				lengthToRemove = 1;
				break;
			}
			}

			if (lengthToRemove) {
				changes.push({
					from:   line.from,
					to:     line.from + lengthToRemove,
					insert: '',
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

	if (!transaction.changes.empty) {
		view.dispatch(view.state.update(transaction));

		return true;
	}


	return undoTab(view);
};
