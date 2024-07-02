import { EditorView } from '@codemirror/view';

import { MirageMDE } from '../../mirage-mde.js';
import { type MMDECommand } from '../../registry/action-registry.js';


/**
 * Preview action.
 */
export const togglePreview: MMDECommand = (
	view: EditorView, editor: MirageMDE, force?: boolean,
) => {
	const { gui, guiClasses, options, options: { host } } = editor;
	const show = !(force ?? host?.classList.contains('preview'));
	const previewButton = editor.toolbarElements['preview']?.value;
	const sidebysideButton = editor.toolbarElements['side-by-side']?.value;
	let refocus = false;

	if (show) {
		guiClasses.editor['hidden'] = true;
		guiClasses.preview['hidden'] = false;
		host?.classList.toggle('preview', true);
		host?.classList.toggle('sidebyside', false);
		previewButton?.classList.toggle('active', true);
		sidebysideButton?.classList.toggle('active', false);

		const value = options.previewRender?.(editor.value()) ?? Promise.resolve('');
		gui.preview.setContent(value);
		gui.preview.style.width = 'auto';
	}
	else {
		refocus = true;
		guiClasses.editor['hidden'] = false;
		guiClasses.preview['hidden'] = true;
		host?.classList.toggle('sidebyside', false);
		host?.classList.toggle('preview', false);
		previewButton?.classList.toggle('active', false);
	}

	// Update host to apply new css classes.
	host?.requestUpdate();
	gui.toolbar.requestUpdate();

	if (refocus)
		host?.updateComplete.then(() => view.focus());

	return true;
};
