import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';


@customElement('ha-route2')
export class Route2 extends LitElement {

	public override render() {
		return html`
			<div>Route 2</div>
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
		'ha-route2': Route2;
	}
}
