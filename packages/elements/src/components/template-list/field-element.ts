import { customElement, MimicElement } from '@roenlie/mimic-lit/element';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { css, html } from 'lit';


@customElement('mm-field')
export class MMField extends MimicElement {

	public override render() {
		return html`
		<slot></slot>
		`;
	}

	public static override styles = [
		sharedStyles,
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
		'mm-field': MMField;
	}
}
