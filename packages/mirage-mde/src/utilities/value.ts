import { MirageMDE } from '../mirage-mde.js';


/**
 * Get or set the text content.
 */
export const value = (scope: MirageMDE, val?: string): MirageMDE | string => {
	if (!scope.editor)
		return '';

	const state = scope.editor.state;
	const currentValue = state.doc.toString();

	if (val === undefined) {
		return currentValue;
	}
	else if (val !== currentValue) {
		scope.editor.dispatch(state.update({
			changes: {
				from:   0,
				to:     state.doc.length,
				insert: val,
			},
		}));
	}

	return scope;
};
