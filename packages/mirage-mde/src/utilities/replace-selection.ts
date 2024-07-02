import { type ChangeSpec, EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';


export const replaceSelection = (view: EditorView, replacement: string) => {
	const transaction = view.state.changeByRange(range => {
		const changes: ChangeSpec[] = [];

		changes.push({
			from:   range.from,
			to:     range.to,
			insert: replacement,
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
