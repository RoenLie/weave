import { html, LitElement, render } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('b-app')
export class BuilderApp extends LitElement {

	protected save() {
		import.meta.hot?.send('save', {
			tagname: 'hei der',
		});
	}

	protected override render() {
		return html`
		hei


		<button @click=${ this.save }>
			Save data
		</button>
		`;
	}

}
render(document.createElement('b-app'), document.body);
