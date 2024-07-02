import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/* ------------------------------------------------- */

@customElement('mi-content')
export class MiContentCmp extends LitElement {

	//#region properties
	/** The label that will be displayed when this component is contained. */
	@property({ type: String }) public containedLabel = '';

	/** Function that renders the output for this content component. */
	@property({ type: Object }) public renderFn = () => html``;
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	protected override createRenderRoot() {
		return this;
	}
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		return html`
		<style>
			mi-content {
				display: block;
				overflow: hidden;
			}
			mi-content > * {
				height: 100%;
			}
		</style>
		${ this.renderFn() }
		`;
	}
	//#endregion


	//#region style
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-content': MiContentCmp;
	}
}
