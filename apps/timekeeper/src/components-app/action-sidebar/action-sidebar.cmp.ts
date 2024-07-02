import { EsIconCmp } from '@eyeshare/web-components';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { actionSidebarStyle } from './action-sidebar.styles.js';

EsIconCmp;
/* ------------------------------------------------- */

@customElement('mi-action-sidebar')
export class MiActionSidebarCmp extends LitElement {

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
			<es-button type="icon" size="large" icon-name="lightbulb" icon-size="large"></es-button>
			<es-button type="icon" size="large" icon-name="calendar2-check" icon-size="large"></es-button>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = actionSidebarStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-action-sidebar': MiActionSidebarCmp;
	}
	interface HTMLElementEventMap {

	}
}
