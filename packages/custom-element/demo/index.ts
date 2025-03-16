import '../src/adapter-element.ts';

import { html, render } from 'lit-html';

import { css, type CSSStyle, CustomElement } from '../src/custom-element.ts';


export class RootPage extends CustomElement {

	static {
		this.register('iv-root-page');
	}

	protected override render(): unknown {
		return html`
		<iv-image-viewer
			image-src="/spiral.jpg"
			reset-on-new-image
		></iv-image-viewer>

		<s-controls>
		</s-controls>
		`;
	}

	static override styles: CSSStyle = css`
	:host {
		display: grid;
		place-items: center;
	}
	iv-image-viewer {
		height: 80dvh;
		width: clamp(320px, 80vw, 1800px);
		border: 1px solid darkslateblue;
	}
	s-controls {
		display: flex;
	}
	`;

}

render(html`<iv-root-page></iv-root-page>`, document.body);
