import { redo as cmRedo, undo as cmUndo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';

import { type MMDECommand } from '../../registry/action-registry.js';


/**
 * Undo action.
 */
export const undo: MMDECommand = (view: EditorView) => {
	cmUndo({
		state:    view.state as any,
		dispatch: view.dispatch as any,
	});

	return true;
};


/**
 * Redo action.
 */
export const redo: MMDECommand = (view: EditorView) => {
	cmRedo({
		state:    view.state as any,
		dispatch: view.dispatch as any,
	});

	return true;
};
