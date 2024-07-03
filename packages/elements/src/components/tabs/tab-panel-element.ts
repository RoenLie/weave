import { domId } from '@roenlie/core/dom';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';


declare global { interface HTMLElementTagNameMap {
	'mm-tab-panel': MMTabPanel;
} }


/**
 * @slot - The tab panel's content.
 */
@customElement('mm-tab-panel')
export class MMTabPanel extends MimicElement {

	//#region properties
	/** The tab panel's name. */
	@property({ reflect: true }) public name = '';

	/** When true, the tab panel will be shown. */
	@property({ type: Boolean, reflect: true }) public active = false;

	private readonly componentId = `${ MMTabPanel.tagName }-${ domId(4) }`;
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
		this.id = this.id.length > 0 ? this.id : this.componentId;
	}
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		this.style.display = this.active ? 'block' : 'none';

		return html`
		<div
			part="base"
			class="tab-panel"
			role="tabpanel"
			aria-hidden=${ this.active ? 'false' : 'true' }
		>
			<slot></slot>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: block;
			overflow: hidden;
		}
		.tab-panel {
			height: 100%;
			border: solid 1px transparent;
			padding: var(--_tab-padding, 0);
		}
		`,
	];
	//#endregion

}
