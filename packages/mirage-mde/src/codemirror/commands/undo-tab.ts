import {  deleteCharBackward, indentLess } from '@codemirror/commands';
import { EditorSelection } from '@codemirror/state';
import { type Command } from '@codemirror/view';


export const undoTab: Command = (view) => {
	const { state, dispatch } = view;

	/* If there is some selected part in the text of the line, delete the tab  at the start of the line */
	if (state.selection.ranges.some((r) => !r.empty))
		return indentLess({ state, dispatch });

	const { doc } = view.state;

	let isPreviousCharTab = false;

	state.changeByRange((range) => {
		const { from, to } = range;
		const line = doc.lineAt(from);
		const { text: lineText, from: lineFrom } = line;

		/*
      	The actual line string index can be calculated by subtracting lineFrom from the actualFrom
    	*/
		const actualTextIndex = from - lineFrom;

		const previousChar = lineText?.[actualTextIndex - 1];

		/*
			If the previous character is a tab, delete that tab otherwise
			trap the shift+tab by returning true which prevents the focus from being moved out of the editor
    	*/
		if (actualTextIndex > 0 && previousChar === '\t')
			isPreviousCharTab = true;


		return {
			changes: { from, to },
			range:   EditorSelection.cursor(from),
		};
	});

	if (isPreviousCharTab)
		return deleteCharBackward(view);


	// Notify Codemirror that we are trapping shift+tab
	return true;
};
