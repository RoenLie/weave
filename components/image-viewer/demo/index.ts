import { css, CustomElement } from '@roenlie/custom-element';
import { html, render } from 'lit-html';
import { ImageViewer } from '../src/image-viewer.ts';
import type { CSSStyle } from 'node_modules/@roenlie/custom-element/dist/signal-element';


export class RootPage extends CustomElement {

	static {
		this.register('iv-root-page');
		ImageViewer.register();
	}

	protected get imageViewer(): ImageViewer | undefined {
		return this.shadowRoot?.querySelector<ImageViewer>('iv-image-viewer') ?? undefined;
	}

	protected override render(): unknown {
		return html`
		<iv-image-viewer
			image-src="/spiral.jpg"
			reset-on-new-image
		></iv-image-viewer>

		<s-controls>
			<button @click=${ () => this.imageViewer?.api.reset() }>
				Reset
			</button>
			<button @click=${ () => this.imageViewer?.api.fitToView() }>
				Fit to view
			</button>
			<button @click=${ () => this.imageViewer?.api.zoom(1.1) }>
				Zoom in
			</button>
			<button @click=${ () => this.imageViewer?.api.zoom(1 / 1.1) }>
				Zoom out
			</button>
			<button @click=${ () => this.imageViewer?.api.rotate(-90) }>
				rotate left
			</button>
			<button @click=${ () => this.imageViewer?.api.rotate(90) }>
				rotate right
			</button>
		</s-controls>
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
	s-controls {
		display: flex;
	}
	`;

}

render(html`<iv-root-page></iv-root-page>`, document.body);
