import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-header')
export class HeaderCmp extends LitElement {

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	public override render() {
		return html`
		<div class="indicator"></div>
		<slot></slot>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: flex;
			align-items: center;
			padding-right: var(--spacing-s);
			margin-inline: var(--spacing-s);
			height: 55px;
			gap: var(--spacing-m);
			border-radius: var(--spacing-s);
		}
		.indicator {
			padding-right: var(--spacing-s);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-header': HeaderCmp;
	}
}
