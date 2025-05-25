import { LitElement } from 'lit';
import { createRef } from 'lit-html/directives/ref.js';

import { ButtonElement, ButtonElementCmp } from './button.tsx';


class RootElement extends LitElement {

	override connectedCallback(): void {
		super.connectedCallback();
		import('./async.ts').then(m => m.kake());
	}

	protected buttonEl = createRef<ButtonElementCmp>();

	protected override render(): unknown {
		const jsx = (
			<>
				<div on-click={() => { console.log('hei'); }}>Hello there, yay it works</div>
				<ButtonElement ref={this.buttonEl}>
					I am a button!
				</ButtonElement>
			</>
		);

		return jsx;
	}

	static { customElements.define('root-element', this); }

}
