import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('pl-input-demo')
export class InputDemoCmp extends LitElement {

	public override render() {
		return html`
		<pl-input label="Label" size="large" @change=${ () => console.log('hei') }  ></pl-input>
		<pl-input label="Label" size="medium"></pl-input>
		<pl-input label="Label" size="small"></pl-input>
		<pl-input label="Label" placeholder="Placeholder" size="large"></pl-input>
		<pl-input label="Label" placeholder="Placeholder" size="medium"></pl-input>
		<pl-input label="Label" placeholder="Placeholder" size="small"></pl-input>
		<pl-input label="Label" value="Value" size="large"></pl-input>
		<pl-input label="Label" value="Value" size="medium"></pl-input>
		<pl-input label="Label" value="Value" size="small"></pl-input>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
			flex-flow: column;
			gap: 8px;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-input-demo': InputDemoCmp;
	}
}
