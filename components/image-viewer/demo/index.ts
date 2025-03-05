import { css, CustomElement } from '@roenlie/custom-element';
import { html, render } from 'lit-html';
import { ImageViewer } from '../src/image-viewer.ts';
import type { CSSStyle } from 'node_modules/@roenlie/custom-element/dist/signal-element';


export class RootPage extends CustomElement {

	static {
		this.register('iv-root-page');
		ImageViewer.register();
	}

	protected override render(): unknown {
		return html`
		<iv-image-viewer
			imagesrc="/spiral.jpg"
		></iv-image-viewer>
		`;
	}

	public static override styles: CSSStyle = css`
	:host {
		display: grid;
		place-items: center;
	}
	iv-image-viewer {
		height: 80dvh;
		width: clamp(320px, 80vw, 1800px);
		border: 1px solid darkslateblue;
	}
	`;

}

render(html`<iv-root-page></iv-root-page>`, document.body);
