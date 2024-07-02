import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { stageStyle } from './stage.styles.js';

/* ------------------------------------------------- */

@customElement('mi-stage')
export class MiStageCmp extends LitElement {

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
		<div>
			<mi-chess></mi-chess>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = stageStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-stage': MiStageCmp;
	}
	interface HTMLElementEventMap {

	}
}
