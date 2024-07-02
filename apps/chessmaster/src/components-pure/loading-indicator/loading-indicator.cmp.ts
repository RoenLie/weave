import { EsSpinnerCmp } from '@eyeshare/web-components';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { loadingIndicatorStyle } from './loading-indicator.styles.js';

EsSpinnerCmp;
/* ------------------------------------------------- */

@customElement('mi-loading-indicator')
export class MiLoadingIndicatorCmp extends LitElement {

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
		<div class="loader">
			<div class="loader-container">
				<span>Loading</span>
				<es-spinner style="font-size: 3rem;"></es-spinner>
			</div>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = loadingIndicatorStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-loading-indicator': MiLoadingIndicatorCmp;
	}
	interface HTMLElementEventMap {

	}
}
