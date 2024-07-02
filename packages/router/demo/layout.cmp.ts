import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { router } from './router-instance.js';


@customElement('ha-layout')
export class Layout extends LitElement {

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	public override render() {
		return html`
			<div>layout</div>
			<slot></slot>

			<a href="/route2">ALINK</a>
			<button @click=${ () => router.navigate('/route1') }>GOTO ROUTE1</button>
			<button @click=${ () => router.navigate('/route2') }>GOTO ROUTE2</button>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
			background-color: grey;
			border: 1px solid black;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'ha-layout': Layout;
	}
}
