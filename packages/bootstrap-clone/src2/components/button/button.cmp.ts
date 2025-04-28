import { AdapterElement, type CSSStyle, customElement, property } from '@roenlie/custom-element/adapter-element';
import { html } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';

import { createButtonStyles } from './button-styles.ts';


export type ButtonType =
	| 'primary'
	| 'secondary'
	| 'success'
	| 'danger'
	| 'warning'
	| 'info'
	| 'light'
	| 'dark'
	| 'link';


@customElement('bs-button')
export class BsButton extends AdapterElement {

	@property(String) accessor type: ButtonType = 'primary';

	protected override render(): unknown {
		return html`
		<button type="button" class=${ classMap({
			btn:                  true,
			['btn-' + this.type]: true,
		}) }>
			<slot></slot>
		</button>
		`;
	}

	static override styles: CSSStyle = createButtonStyles();

}
