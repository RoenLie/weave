import { InjectableElement, injectableElement } from '@roenlie/lit-utilities/injectable';
import { css, html } from 'lit';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';


@injectableElement(
	'pl-shift-list', {
		modules: [ () => import('./shift-module.js').then(m => m.shiftSettingsModule) ],
	},
)
export class ShiftListCmp extends InjectableElement {

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
	}

	public override render() {
		return html`
		<pl-entity-view
			.scope=${ 'shift:view-config' }
		></pl-entity-view>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: block;
			height: 100%;
			width: 100%;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-shift-list': ShiftListCmp;
	}
}
