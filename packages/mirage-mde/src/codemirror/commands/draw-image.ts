import { deIndent } from '@roenlie/mimic-core/string';

import { type MMDECommand } from '../../registry/action-registry.js';
import { replaceSelection } from '../../utilities/replace-selection.js';


/**
 * Action for drawing an img.
 */
export const drawImage: MMDECommand = (view, scope) => {
	const text = deIndent(scope.registry.draw.get('image') ?? '');
	replaceSelection(view, text);

	return true;
};
