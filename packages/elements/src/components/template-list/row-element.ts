import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';


@customElement('mm-row')
export class MMRow extends MimicElement {

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
		sharedStyles,
		css`
		:host {
			display: flex;
			align-items: center;
			padding-right: var(--mm-spacing-s);
			margin-inline: var(--mm-spacing-s);
			height: 55px;
			gap: var(--mm-spacing-m);
			border-radius: var(--mm-spacing-s);
		}
		:host(:hover) {
			background-color: rgb(var(--mm-color-tertiary) / .1);
		}
		:host([active]) {
			background-color: var(--mm-tertiary-container);
			color: var(--mm-on-tertiary-container);
		}
		.indicator {
			padding-right: var(--mm-spacing-s);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-row': MMRow;
	}
}
