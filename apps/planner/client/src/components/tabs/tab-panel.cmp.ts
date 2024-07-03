import { domId } from '@roenlie/core/dom';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


/**
 * @slot - The tab panel's content.
 *
 * @csspart base - The component's internal wrapper.
 *
 * @cssproperty --padding - The tab panel's padding.
 */
@customElement('pl-tab-panel')
export class TabPanelCmp extends LitElement {

	//#region properties
	/** The tab panel's name. */
	@property({ reflect: true }) public name = '';

	/** When true, the tab panel will be shown. */
	@property({ type: Boolean, reflect: true }) public active = false;

	private readonly attrId = domId();
	private readonly componentId = `pl-tab-panel-${ this.attrId }`;
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
		componentStyles,
		css`
		:host {
			display: block;
			overflow: hidden;
		}
		.tab-panel {
			height: 100%;
			border: solid 1px transparent;
			padding: var(--padding, 0);
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-tab-panel': TabPanelCmp;
	}
}
