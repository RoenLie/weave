import { EsFormCmp, EsInputCmp } from '@eyeshare/web-components';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { chatPanelStyle } from './chat-panel.styles.js';

EsFormCmp; EsInputCmp;
/* ------------------------------------------------- */

@customElement('mi-chat-panel')
export class MiChatPanelCmp extends LitElement {

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
			<es-form>
				<es-input ></es-input>
				<es-input ></es-input>
			</es-form>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = chatPanelStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-chat-panel': MiChatPanelCmp;
	}
	interface HTMLElementEventMap {

	}
}
