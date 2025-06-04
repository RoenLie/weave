import { LitElement } from 'lit';
import { html, svg } from 'lit-html';
import { createRef } from 'lit-html/directives/ref.js';

import { ButtonElementCmp } from './button.tsx';


export class RootElement extends LitElement {

	override connectedCallback(): void {
		super.connectedCallback();
		import('./async.ts').then(m => m.kake());
	}

	protected buttonEl = createRef<ButtonElementCmp>();

	protected override render(): unknown {
		const jsx = <>
			{/*<div on-click={() => { console.log('hei'); }}>Hello there, yay it works</div>
				<ButtonElement ref={this.buttonEl}>
					I am a button!
				</ButtonElement>*/}
			<h1>Welcome to the Demo</h1>
			<p>This is a simple 10-line HTML block.</p>
			<ul>
				<li>First item</li>
				<li>Second item</li>
				<li>Third item</li>
				<li>Fourth item</li>
				<li>Fifth item</li>
			</ul>
			<footer>End of block</footer>
		</>;

		return jsx;
	}

	static { customElements.define('root-element', this); }

}
