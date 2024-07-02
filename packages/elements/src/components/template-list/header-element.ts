import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';


@customElement('mm-header')
export class MMHeader extends MimicElement {

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
		.indicator {
			padding-right: var(--mm-spacing-s);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-header': MMHeader;
	}
}
