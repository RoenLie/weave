import { EditorView } from '@codemirror/view';

import { MirageMDE } from '../../mirage-mde.js';
import { type MMDECommand } from '../../registry/action-registry.js';


const state = new WeakMap<MirageMDE, {
	savedOverflow: string;
	savedHeight: string;
}>();


/**
 * Toggle full screen of the editor.
 */
export const toggleFullScreen: MMDECommand = (view: EditorView, scope: MirageMDE) => {
	const { host } = scope;

	const saved = state.get(scope) ?? { savedHeight: '', savedOverflow: '' };

	const fullscreenState = !host.classList.contains('fullscreen');

	// Prevent scrolling on body during fullscreen active
	if (fullscreenState) {
		saved.savedHeight = host?.style.height ?? '';
		saved.savedOverflow = document.body.style.overflow;

		document.body.style.setProperty('overflow', 'hidden');
		host?.style.setProperty('height', null);
	}
	else {
		document.body.style.setProperty('overflow', saved.savedOverflow);
		host?.style.setProperty('height', saved.savedHeight);
	}

	host?.classList.toggle('fullscreen', fullscreenState);
	host?.requestUpdate();

	// Update toolbar button
	scope.toolbarElements['fullscreen']?.value?.classList.toggle('active');

	state.set(scope, saved);

	return true;
};
