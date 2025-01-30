import { html } from 'lit-html';
import { CustomElement } from './app/custom-element.ts';
import { Router } from '@sanguinejs/router';


export class RouterCmp extends CustomElement {

	static { this.register('poe-router'); }

	protected routes = new Router(this, [
		{
			path:   '/',
			render: () => html`Hello there`,
		},
		{
			path:  '/svg-editor',
			enter: async () => {
				await import('./pages/svg-editor/svg-editor-page.ts');

				return true;
			},
			render: () => html`<poe-svg-editor></poe-svg-editor>`,
		},
		{
			path:  '/canvas-editor',
			enter: async () => {
				await import('./pages/canvas-editor/canvas-editor-page.ts');

				return true;
			},
			render: () => html`<poe-canvas-editor></poe-canvas-editor>`,
		},
	]);


	protected override render(): unknown {
		return html`
		${ this.routes.outlet() }
		`;
	}

}
