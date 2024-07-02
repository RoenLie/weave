import { EditorState } from '@codemirror/state';


export const cmFindBeginningOfWord = (
	position: number, state: EditorState,
) => {
	if (position < 0)
		return 0;

	for (let i = position; i >= 0; i--) {
		const substring = state.doc.sliceString(i - 1, i);
		if (!/[\w-]/.test(substring))
			return i;
	}

	return 0;
};


export const cmfindEndOfWord = (
	position: number, state: EditorState,
) => {
	if (position < 0)
		return 0;

	let i = position;
	let substring = '';
	while (substring !== undefined) {
		substring = state.doc.sliceString(i, i + 1);
		if (substring === undefined)
			break;

		if (!/[\w-]/.test(substring))
			return i;

		i++;
	}

	return i;
};
