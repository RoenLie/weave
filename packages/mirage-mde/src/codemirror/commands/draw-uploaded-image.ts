import { deIndent } from '@roenlie/mimic-core/string';

import { type MMDECommand } from '../../registry/action-registry.js';
import { replaceSelection } from '../../utilities/replace-selection.js';


/**
 * Action for opening the browse-file window to upload an image to a server.
 */
export const drawUploadedImage: MMDECommand = (view, scope) => {
	const text = deIndent(scope.registry.draw.get('uploadedImage') ?? '');
	replaceSelection(view, text);

	// TODO: Draw the image template with a fake url? ie: '![](importing foo.png...)'
	scope.openBrowseFileWindow();

	return true;
};
