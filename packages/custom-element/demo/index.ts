import { html, render } from 'lit-html';

import { AdapterElement } from '../src/adapter/adapter-element.ts';
import { property, state } from '../src/adapter/decorators.ts';
import { css, type CSSStyle } from '../src/adapter/helpers.ts';


export class RootPage extends AdapterElement {

	static override tagName = 'iv-root-page';

	protected override render(): unknown {
		return html`
		<s-controls>
			<test-adapter></test-adapter>
		</s-controls>
		`;
	}

	static override styles: CSSStyle = css`
		:host {
			display: grid;
			place-items: center;
		}
		s-controls {
			display: flex;
		}
	`;

}
RootPage.register();


class TestAdapter extends AdapterElement {

	static override tagName = 'test-adapter';

	@property(String, { reflect: true }) accessor label = 'Hello World';
	@property(Number) accessor labelCount = 0;
	@state() protected accessor count = 0;

	override connected(): void {
		super.connected();
	}

	protected override render() {
		return html`
		<h1>${ this.label }</h1>
		`;
	}

	static override styles = css`
		:host {
			display: block;
			background-color: red;
		}
	`;

}
TestAdapter.register();


render(html`<iv-root-page></iv-root-page>`, document.body);
