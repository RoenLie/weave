import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { appStyle } from './app.styles.js';

/* ------------------------------------------------- */

@customElement('mi-chess-dimension')
export class MiChessDimensionCmp extends LitElement {

	//#region properties
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div class="base">
			<mi-sidebar-menu></mi-sidebar-menu>
			<mi-stage></mi-stage>
			<mi-chat-panel></mi-chat-panel>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = appStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-chess-dimension': MiChessDimensionCmp;
	}
	interface HTMLElementEventMap {

	}
}
