import { MirageMDE } from '../mirage-mde.js';


/**
 * Get or set the text content.
 */
export const value = (scope: MirageMDE, val?: string): MirageMDE | string => {
	const state = scope.editor.state;

	if (val === undefined) {
		return state.doc.toString();
	}
	else {
		scope.editor.dispatch(state.update({
			changes: {
				from:   0,
				to:     state.doc.length,
				insert: val,
			},
		}));

		return scope;
	}
};
