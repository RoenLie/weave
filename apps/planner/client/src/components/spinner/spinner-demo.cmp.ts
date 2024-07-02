import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('pl-spinner-demo')
export class SpinnerDemoCmp extends LitElement {

	public override render() {
		return html`
			<pl-spinner></pl-spinner>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-spinner-demo': SpinnerDemoCmp;
	}
}
