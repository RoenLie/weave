import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('mm-docs-demo')
export class DemoComponent extends LitElement {

	protected override render() {
		return html`
		Hello
		`;
	}

}
