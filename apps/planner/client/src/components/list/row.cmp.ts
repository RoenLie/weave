import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-row')
export class RowCmp extends LitElement {

	@property({ type: Boolean, reflect: true }) public active?: boolean;
	@property({ type: Object, attribute: false }) public item?: object;

	public override connectedCallback(): void {
		super.connectedCallback();

		this.tabIndex = 0;
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
		:host(:hover) {
			background-color: rgb(var(--color-tertiary) / .1);
		}
		:host([active]) {
			background-color: var(--tertiary-container);
			color: var(--on-tertiary-container);
		}
		.indicator {
			padding-right: var(--spacing-s);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-row': RowCmp;
	}
}
