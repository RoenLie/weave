import { MMSpinner } from '@roenlie/elements/spinner';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

MMSpinner.register();


@customElement('mm-spinner-demo')
export class SpinnerDemoCmp extends LitElement {

	public override render() {
		return html`
			<mm-spinner></mm-spinner>
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
		'mm-spinner-demo': SpinnerDemoCmp;
	}
}
