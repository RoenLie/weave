import { deIndent } from '@roenlie/mimic-core/string';

import { type MMDECommand } from '../../registry/action-registry.js';
import { replaceSelection } from '../../utilities/replace-selection.js';


/**
 * Action for drawing a table.
 */
export const drawTable: MMDECommand = (view, scope) => {
	const text = deIndent(scope.registry.draw.get('table') ?? '');
	replaceSelection(view, text);

	return true;
};
