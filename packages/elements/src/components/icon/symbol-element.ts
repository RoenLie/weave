import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';


@customElement('mm-symbol')
export class SymbolElement extends MimicElement {

	@property() public source = '';
	@property() public icon = '';

	public override connectedCallback() {
		super.connectedCallback();
		this.setAttribute('inert', '');
	}

	public override render() {
		return html`
		<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<use href=${ this.source + '#' + this.icon }></use>
		</svg>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			contain: strict;
			box-sizing: content-box;
			display: grid;
			place-items: center;
		}
		:host, svg {
			width: 1em;
			height: 1em;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-symbol': SymbolElement;
	}
}
