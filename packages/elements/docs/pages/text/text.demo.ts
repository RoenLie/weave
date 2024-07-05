import { MMText } from '@roenlie/elements/text';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

MMText.register();


@customElement('mm-text-demo')
export class TextDemo extends LitElement {

	public override render() {
		return html`
		<mm-text textTransform="capitalize">edit timer</mm-text>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: block;
			height: 200px;
			aspect-ratio: 1;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-progress-bar-demo': TextDemo;
	}
}
