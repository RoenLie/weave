import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { chessStyle } from './chess.styles.js';

/* ------------------------------------------------- */

@customElement('mi-chess')
export class MiChessCmp extends LitElement {

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
			<mi-chessboard></mi-chessboard>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = chessStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-chess': MiChessCmp;
	}
	interface HTMLElementEventMap {

	}
}
