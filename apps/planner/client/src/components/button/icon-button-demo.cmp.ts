import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('pl-icon-button-demo')
export class IconButtonDemoCmp extends LitElement {

	public override render() {
		return html`
			<pl-button type="icon" variant="text" shape="rounded" size="x-small">
				<pl-boot-icon icon="x"></pl-boot-icon>
			</pl-button>
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
		'pl-icon-button-demo': IconButtonDemoCmp;
	}
}
