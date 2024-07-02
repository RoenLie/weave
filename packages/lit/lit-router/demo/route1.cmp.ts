import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('ha-route1')
export class Route1 extends LitElement {

	public override render() {
		return html`
			<div>Route 1</div>
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
		'ha-route1': Route1;
	}
}
