import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { AegisTestComponent } from './aegis-component.js';

AegisTestComponent.register();


@customElement('aegis-introduction')
export class IntroDemo extends LitElement {

	protected override render(): unknown {
		return html`
		<aegis-test-component></aegis-test-component>
		`;
	}

}
