import { html, LitElement } from 'lit';

import { customElement } from 'lit/decorators.js';
import { Routes } from '@lit-labs/router';
import { provide } from '@roenlie/lit-context';
import { sharedStyles } from '../app/utils/shared-styles.ts';
import mainStyles from './main.css' with { type: 'css' };


export const mainRoutesID = 'main-routes';


@customElement('syn-main')
export class MainCmp extends LitElement {

	@provide(mainRoutesID) protected routes = new Routes(this, [
		{
			path:   '',
			enter:  () => !!import('../pages/search/search-page.ts'),
			render: () => html`<syn-search-page></syn-search-page>`,
		},
		{
			path:   'capture/*',
			enter:  () => !!import('../pages/capture/capture-page.ts'),
			render: () => html`<syn-capture-page></syn-capture-page>`,
		},
	], {
		fallback: {
			render: () => html`Not Found`,
		},
	});

	protected override render() {
	  	return html`
		${ this.routes.outlet() }

		<nav>
			<a tabindex="-1" href=${ this.routes.link('') }>
				<button synapse outlined>
					Home
				</button>
			</a>
			<a tabindex="-1" href=${ this.routes.link('capture/camera') }>
				<button synapse outlined>
					Capture
				</button>
			</a>
		</nav>
		`;
	}

	public static override styles = [
		sharedStyles,
		mainStyles,
	];

}
