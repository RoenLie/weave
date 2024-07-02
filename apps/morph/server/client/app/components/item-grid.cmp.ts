import { css, type CSSResultGroup, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('m-item-grid')
export class ItemGrid extends LitElement {

	protected override render(): unknown {
		return html`
		Item grid here...
		`;
	}

	public static override styles: CSSResultGroup = [
		css`
		`,
	];

}
