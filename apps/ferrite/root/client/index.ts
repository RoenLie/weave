import { css, html, LitElement, render } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './src/nav.cmp.ts';


@customElement('f-root')
export class FRootCmp extends LitElement {

	@state() protected src = '/absence';

	protected override render() {
		return html`
		<f-nav></f-nav>
		<iframe .src=${ this.src }>
		</iframe>
		`;
	}

	public static override styles = css`
	:host {
		display: grid;
		grid-template-columns: max-content auto;
	}
	iframe {
		all: unset;
		display: block;
		height: 100%;
		width: 100%;
	}
	`;

}

render(html`<f-root></f-root>`, document.body);
