import { css, html, LitElement } from 'lit';

import { customElement } from 'lit/decorators.js';
import { Routes } from '@lit-labs/router';
import { provide } from '@roenlie/lit-context';


@customElement('syn-main')
export class MainCmp extends LitElement {

	@provide('main-routes') protected routes = new Routes(this, [
	  { path: '', render: () => html`<h1>Home</h1>` },
	  {
			path:   'capture',
			enter:  () => !!import('../pages/capture/capture-page.ts'),
			render: () => html`<syn-capture-page></syn-capture-page>`,
		},
	], {
		fallback: {
			render: () => html`Not Found`,
		},
	});

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected override render() {
	  	return html`
		${ this.routes.outlet() }

		<nav>
			<a href=${ this.routes.link('') }>
				Home
			</a>
			<a href=${ this.routes.link('capture') }>
				Capture
			</a>
		</nav>
		`;
	}

	public static override styles = css`
	:host {
		height: 100%;
		display: grid;
		grid-template-rows: 1fr auto;
	}
	nav {
		grid-row: 2/3;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
	}
	`;

}
