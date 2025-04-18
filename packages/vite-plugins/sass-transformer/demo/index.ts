import { css as sass, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import styles from './index.scss' with { type: 'scss' };


@customElement('demo-element')
export class DemoCmp extends LitElement {

	@property({ type: Boolean }) inverse = false;

	protected override render(): unknown {
		return html`
		Hello
		`;
	}

	static override styles = [
		styles,
		sass`
		@use 'base';

		.inverse {
			background-color: base.$primary-color;
			color: white;
		}
		`,
	];

}


console.log(DemoCmp.styles);
