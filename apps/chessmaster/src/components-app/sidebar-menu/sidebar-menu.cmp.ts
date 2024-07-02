import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { sidebarMenuStyle } from './sidebar-menu.styles.js';

/* ------------------------------------------------- */

@customElement('mi-sidebar-menu')
export class MiSidebarMenuCmp extends LitElement {

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
		<div>sidebar-menu</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = sidebarMenuStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-sidebar-menu': MiSidebarMenuCmp;
	}
	interface HTMLElementEventMap {

	}
}
