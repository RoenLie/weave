import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';


@customElement('syn-root')
export class RootCmp extends LitElement {

	private router = new Router(this, [
		//
		//{ path: '/', render: () => html`<h1>Home</h1>` },
		{ path: '/login', render: () => html`LOGIN!` },
	], {
		fallback: {
			enter:  () => !!import('./main.cmp.ts'),
			render: () => html`
			<syn-main></syn-main>
			`,
		},
	});

	protected override render() {
		return this.router.outlet();
	}

	public static override styles = css`
	:host {
		display: contents;
	}
	`;

}
