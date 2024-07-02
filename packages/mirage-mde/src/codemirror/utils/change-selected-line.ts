import { type ChangeSpec, EditorSelection, EditorState, Line } from '@codemirror/state';


export const changeBySelectedLine = (
	state: EditorState, f: (line: Line, change: any[], range: any) => void,
) => {
	let atLine = -1;

	return state.changeByRange(range => {
		const changes: ChangeSpec[] = [];

		for (let pos = range.from; pos <= range.to;) {
			const line = state.doc.lineAt(pos);
			if (line.number > atLine && (range.empty || range.to > line.from)) {
				f(line, changes, range);
				atLine = line.number;
			}

			pos = line.to + 1;
		}
		const changeSet = state.changes(changes);

		return {
			changes,
			range: EditorSelection.range(
				changeSet.mapPos(range.anchor, 1),
				changeSet.mapPos(range.head, 1),
			),
		};
	});
};
