import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('pl-progress-demo')
export class ProgressDemoCmp extends LitElement {

	public override render() {
		return html`
			<pl-progress-bar indeterminate></pl-progress-bar>
			<pl-progress-ring indeterminate></pl-progress-ring>
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
		'pl-progress-demo': ProgressDemoCmp;
	}
}
