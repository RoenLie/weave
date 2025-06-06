import { LitElement } from 'lit';


export class RootElement extends LitElement {

	protected override render(): unknown {
		const jsx = <>
			<h1>Welcome to the Demo</h1>
		</>;

		return jsx;
	}

	static { customElements.define('root-element', this); }

}
