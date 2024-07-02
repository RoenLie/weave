import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


export type IconSize = 'x-small' | 'small' | 'medium' | 'large' | 'x-large';


@customElement('pl-boot-icon')
export class BootstrapIconCmp extends LitElement {

	@property() public icon = '';
	@property() public size: IconSize = 'medium';

	protected get iconSize() {
		return {
			'x-small': '12px',
			'small':   '16px',
			'medium':  '20px',
			'large':   '24px',
			'x-large': '28px',
		}[this.size];
	}

	public override connectedCallback(): void {
		super.connectedCallback();
		this.setAttribute('inert', '');
		this.style.fontSize = this.iconSize;
	}

	public override render(): unknown {
		return html`
		<pl-symbol
			source="/assets/bootstrap-icons.svg"
			icon=${ this.icon }
		></pl-symbol>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			place-items: center;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-boot-icon': BootstrapIconCmp;
	}
}
