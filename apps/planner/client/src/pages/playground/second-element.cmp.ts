import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';


@customElement('pl-second-component')
export class SecondComponentCmp extends LitElement {

	protected override render() {
		return html`
		<h1>yoyo second</h1>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: block;
		}
		div {
			display: grid;
			background-color: black;
		}
		`,
	];

}
declare global {
	interface HTMLElementTagNameMap {
		'pl-second-component': SecondComponentCmp;
	}
}
