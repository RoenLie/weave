import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

import { ListCmp } from './list.cmp.js';

ListCmp;

@customElement('pl-first-component')
export class FirstComponentCmp extends LitElement {

	protected override render() {
		return html`
		<div class="base">
			<pl-list></pl-list>
		</div>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: block;
		}
		.base {
			display: grid;
			gap: 12px;
		}
		pl-list {
			height: 200px;
			background-color: lime;
		}

		`,
	];

}
declare global {
	interface HTMLElementTagNameMap {
		'pl-first-component': FirstComponentCmp;
	}
}
