import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('widget-grid')
export class WidgetGridCmp extends LitElement {

	protected override render() {
		return html`
		<slot></slot>
		`;
	}

}
