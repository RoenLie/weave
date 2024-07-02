import '../../components/mirage-mde-window.js';

import { html, render } from 'lit';

import { type MMDECommand } from '../../registry/action-registry.js';


/**
 * Action for opening an external window which holds a live preview of the rendered markdown.
 */
export const popoutPreview: MMDECommand = (view, scope) => {
	if (scope.isWindowActive)
		return false;

	const windowCfg = Object.entries({
		popup:  true,
		width:  1200,
		height: 1200,
		top:    window.outerHeight / 2 + window.screenY - (1200 / 2),
		left:   window.outerWidth / 2 + window.screenX - (1200 / 2),
	}).map(([ key, val ]) => `${ key }=${ val }`).join(',');

	const winHandle = window.open(undefined, 'window-preview', windowCfg)!;

	const computedStyles = scope.host.computedStyleMap();

	const previewFont = computedStyles.get('--_mmde-preview-family')?.toString();
	const customProperties = [ ...computedStyles ].filter(style => style[0].startsWith('--'));
	const forwardedProperties = customProperties.map(([ key, val ]) => `${ key }: ${ val }`).join(';\n');

	render(html`
	<style>
		body {
			display: grid;
			background-color: black;
			color: white;
			min-height: 100dvh;
			font-family: ${ previewFont };
			${ forwardedProperties }
		}
		* {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}
		*::-webkit-scrollbar {
			width: 12px;
			height: 12px;
		}
		*::-webkit-scrollbar-track {
			background: rgb(30,30,30);
		}
		*::-webkit-scrollbar-thumb {
			background: rgb(50,50,50);
			border-radius: 0px;
			background-clip: padding-box;
		}
		*::-webkit-scrollbar-corner {
			background: rgb(30,30,30);
		}
	</style>
	`, winHandle.document.head);

	render(html`
	<mirage-mde-window
		.scope=${ scope }
	></mirage-mde-window>
	`, winHandle!.document.body);

	const previewButton = scope.toolbarElements['popout']?.value;
	previewButton?.classList.toggle('active', true);

	winHandle?.addEventListener('beforeunload', () => {
		previewButton?.classList.toggle('active', false);
		scope.gui.window = undefined;
	}, {
		once: true,
	});

	globalThis.addEventListener('beforeunload', () => {
		winHandle.close();
	});

	return true;
};
