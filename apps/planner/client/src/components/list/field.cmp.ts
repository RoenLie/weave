import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-field')
export class FieldCmp extends LitElement {

	public override render() {
		return html`
		<slot></slot>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-field': FieldCmp;
	}
}
