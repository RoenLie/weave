import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import galleryStyles from './gallery.css' with { type: 'css' };


@customElement('syn-capture-gallery')
export class CaptureGalleryCmp extends LitElement {

	@property({ type: Array }) public images: string[];

	protected override render(): unknown {
		return html`

		`;
	}

	public static override styles = [ galleryStyles ];

}
