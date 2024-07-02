import { InjectableElement, injectableElement } from '@roenlie/lit-utilities/injectable';
import { css, html } from 'lit';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';


@injectableElement(
	'pl-user-list', {
		modules: [ () => import('./user-config-module.js').then(m => m.userSettingsModule) ],
	},
)
export class UserListCmp extends InjectableElement {

	public override connectedCallback() {
		super.connectedCallback();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
	}

	public override render() {
		return html`
		<pl-entity-view
			.scope=${ 'user:view-config' }
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
		'pl-user-list': UserListCmp;
	}
}
