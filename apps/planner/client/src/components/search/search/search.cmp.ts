import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';


@customElement('pl-search-input')
export class SearchInputCmp extends LitElement {

	//#region properties
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		return html`
		<div>search</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		componentStyles,
		css`
		:host {
			display: inline-flex;
			padding: 12px;
			border: 1px solid black;
			border-radius: 8px;
			box-shadow: 0 0 2px rgba(0, 0, 0, 0.6);
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-search-input': SearchInputCmp;
	}
}
