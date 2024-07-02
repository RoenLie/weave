import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ContentController } from './content-controller.js';

/* ------------------------------------------------- */

@customElement('mi-content-container')
export class MiContentContainerCmp extends LitElement {

	//#region properties
	@property({ type: String, reflect: true }) public contentId: string;
	//#endregion


	//#region controllers
	protected readonly contentCtrl: ContentController = new ContentController({ host: this });
	//#endregion


	//#region lifecycle
	protected override createRenderRoot() {
		return this;
	}
	//#endregion


	//#region logic
	//#endregion


	//#region template
	protected override render() {
		return html`
		<style>
			mi-content-container {
				display: block;
				overflow: hidden;
			}
			mi-content-container > * {
				height: 100%;
			}
		</style>
		${ this.contentCtrl.getByID(this.contentId)?.element }
		`;
	}
	//#endregion


	//#region style
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-content-container': MiContentContainerCmp;
	}
}
