import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';

import { MMNavRailItem } from './nav-rail-item-element.js';

MMNavRailItem.register();


/**
 * Works as a parent element for es-navigation-rail-item elements.
 * @slot start - logical position start slot of the navigation rail.
 * @slot end - logical position end slot of the navigation rail.
 * es-navigation-rail-item placed in the end slot will be assigned the `button` role.
 */
@customElement('mm-nav-rail')
export class MMNavRail extends MimicElement {

	//#region properties
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	protected handleFooterSlotChange = () => {
		const itemTag = MMNavRailItem.tagName;
		const footerItems = this.querySelectorAll(`${ itemTag }[slot="end"], [slot="end"] ${ itemTag }`);
		footerItems.forEach(item => item.setAttribute('role', 'button'));
	};

	protected handleMousedown = (ev: PointerEvent) => {
		ev.detail > 1 && ev.preventDefault();
	};
	//#endregion


	//#region template
	public override render() {
		return html`
		<main part="base" class="base" @mousedown=${ this.handleMousedown }>
			<section part="section">
				<slot name="start"></slot>
			</section>

			<footer part="footer">
				<slot name="end" @slotchange=${ this.handleFooterSlotChange }></slot>
			</footer>
		</main>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: block;
			height: 100%;
		}
		.base {
			height: 100%;
			display: flex;
			flex-flow: column nowrap;
		}

		section {
			flex-grow: 1;

			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			justify-content: start;
			padding-block: var(--mm-internal-spacing-s);
		}

		footer {
			flex-grow: 0;

			display: flex;
			flex-flow: column nowrap;
			align-items: center
		}

		footer ::slotted(*) {
			--mm-nav-item-height: 56px;
		}
		`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-nav-rail': MMNavRail;
	}
}
